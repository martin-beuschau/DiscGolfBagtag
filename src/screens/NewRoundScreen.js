import React, { useState, useEffect } from 'react';
import {
    View,
    Text,
    ScrollView,
    TouchableOpacity,
    StyleSheet,
    Alert,
    TextInput,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

import { storage } from '../utils/storage';
import { processNewRound, validateRound, getBagtagChanges, redistributeBagtags } from '../utils/bagtagLogic';

const PlayerSelector = ({ player, selected, onToggle }) => (
    <TouchableOpacity
        style={[styles.playerSelector, selected && styles.playerSelectorSelected]}
        onPress={() => onToggle(player.id)}
    >
        <View style={styles.selectorContent}>
            <View style={[styles.checkbox, selected && styles.checkboxSelected]}>
                {selected && <Ionicons name="checkmark" size={16} color="white" />}
            </View>
            <Text style={[styles.selectorText, selected && styles.selectorTextSelected]}>
                {player.name}
            </Text>
            <View style={[styles.badge, { backgroundColor: getBagtagColor(player.currentBagtag) }]}>
                <Text style={styles.badgeText}>#{player.currentBagtag}</Text>
            </View>
        </View>
    </TouchableOpacity>
);

const ScoreInput = ({ participant, onScoreChange }) => (
    <View style={styles.scoreInputContainer}>
        <View style={styles.scoreInputHeader}>
            <Text style={styles.scoreInputName}>{participant.playerName}</Text>
            <View style={[styles.badge, { backgroundColor: getBagtagColor(participant.currentBagtag) }]}>
                <Text style={styles.badgeText}>#{participant.currentBagtag}</Text>
            </View>
        </View>
        <TextInput
            style={styles.scoreInput}
            value={participant.score ? participant.score.toString() : ''}
            onChangeText={(text) => {
                const score = text ? parseInt(text) : null;
                onScoreChange(participant.playerId, score);
            }}
            placeholder="Score..."
            keyboardType="numeric"
            maxLength={3}
        />
    </View>
);

const ResultPreview = ({ participants }) => {
    console.log('ResultPreview received participants:', participants);

    const changes = getBagtagChanges(participants);
    console.log('After getBagtagChanges:', changes);

    return (
        <View style={styles.resultContainer}>
            <Text style={styles.resultTitle}>Ny Bagtag Fordeling</Text>
            {changes.map((participant, index) => (
                <View key={participant.playerId} style={styles.resultRow}>
                    <Text style={styles.resultPlace}>{index + 1}.</Text>
                    <Text style={styles.resultName}>{participant.playerName}</Text>
                    <Text style={styles.resultScore}>{participant.score}</Text>
                    <View style={styles.bagtagChange}>
                        <Text style={styles.bagtagFrom}>#{participant.oldBagtag}</Text>
                        <Text style={[
                            styles.changeArrow,
                            { color: getChangeColor(participant.changeType) }
                        ]}>
                            {participant.changeText}
                        </Text>
                        <Text style={styles.bagtagTo}>#{participant.newBagtag}</Text>
                    </View>
                </View>
            ))}
        </View>
    );
};

const getBagtagColor = (bagtag) => {
    if (bagtag === 1) return '#ffd700';
    if (bagtag === 2) return '#c0c0c0';
    if (bagtag === 3) return '#cd7f32';
    if (bagtag <= 5) return '#3b82f6';
    return '#6b7280';
};

const getChangeColor = (changeType) => {
    if (changeType === 'up') return '#16a34a';
    if (changeType === 'down') return '#dc2626';
    return '#6b7280';
};

export default function NewRoundScreen({ navigation }) {
    const [players, setPlayers] = useState([]);
    const [selectedPlayers, setSelectedPlayers] = useState(new Set());
    const [participants, setParticipants] = useState([]);
    const [step, setStep] = useState(1); // 1: Select players, 2: Enter scores, 3: Preview
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        loadPlayers();
    }, []);

    const loadPlayers = async () => {
        try {
            const loadedPlayers = await storage.getPlayers();
            setPlayers(loadedPlayers.sort((a, b) => a.currentBagtag - b.currentBagtag));
        } catch (error) {
            console.error('Error loading players:', error);
        } finally {
            setLoading(false);
        }
    };

    const togglePlayerSelection = (playerId) => {
        const newSelected = new Set(selectedPlayers);
        if (newSelected.has(playerId)) {
            newSelected.delete(playerId);
        } else {
            newSelected.add(playerId);
        }
        setSelectedPlayers(newSelected);
    };

    const proceedToScoreEntry = () => {
        const selectedPlayerList = players.filter(p => selectedPlayers.has(p.id));
        const participantList = selectedPlayerList.map(player => ({
            playerId: player.id,
            playerName: player.name,
            currentBagtag: player.currentBagtag,
            oldBagtag: player.currentBagtag,
            score: null
        }));
        setParticipants(participantList);
        setStep(2);
    };

    const updateScore = (playerId, score) => {
        setParticipants(prev => prev.map(p =>
            p.playerId === playerId ? { ...p, score } : p
        ));
    };

    const proceedToPreview = () => {
        const errors = validateRound(participants);
        if (errors.length > 0) {
            Alert.alert('Fejl i indtastning', errors.join('\n'));
            return;
        }

        console.log('Before redistributeBagtags, participants:', participants);

        // Apply bagtag redistribution algorithm
        const redistributedParticipants = redistributeBagtags(participants);

        console.log('After redistributeBagtags:', redistributedParticipants);

        // Update participants with new bagtags for preview
        setParticipants(redistributedParticipants);
        setStep(3);
    };

    const saveRound = async () => {
        try {
            const rounds = await storage.getRounds();
            const { round, updatedPlayers } = processNewRound(participants, players);

            const newRounds = [round, ...rounds];
            await storage.saveRounds(newRounds);
            await storage.savePlayers(updatedPlayers);

            Alert.alert(
                'Runde gemt!',
                'Bagtags er opdateret',
                [
                    {
                        text: 'OK',
                        onPress: () => {
                            // Reset form
                            setSelectedPlayers(new Set());
                            setParticipants([]);
                            setStep(1);
                            navigation.navigate('Hjem');
                        }
                    }
                ]
            );
        } catch (error) {
            console.error('Error saving round:', error);
            Alert.alert('Fejl', 'Kunne ikke gemme runden');
        }
    };

    const goBack = () => {
        if (step > 1) {
            setStep(step - 1);
        }
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <Text>Indlæser...</Text>
            </View>
        );
    }

    return (
        <SafeAreaView style={styles.container}>
            {/* Step 1: Select Players */}
            {step === 1 && (
                <ScrollView style={styles.content}>
                    <Text style={styles.stepTitle}>Vælg Deltagere</Text>
                    <Text style={styles.stepSubtitle}>
                        Vælg de spillere der deltager i runden
                    </Text>

                    {players.map(player => (
                        <PlayerSelector
                            key={player.id}
                            player={player}
                            selected={selectedPlayers.has(player.id)}
                            onToggle={togglePlayerSelection}
                        />
                    ))}

                    <TouchableOpacity
                        style={[
                            styles.nextButton,
                            selectedPlayers.size < 2 && styles.nextButtonDisabled
                        ]}
                        onPress={proceedToScoreEntry}
                        disabled={selectedPlayers.size < 2}
                    >
                        <Text style={styles.nextButtonText}>
                            Næste ({selectedPlayers.size} spillere)
                        </Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Step 2: Enter Scores */}
            {step === 2 && (
                <ScrollView style={styles.content}>
                    <View style={styles.stepHeader}>
                        <TouchableOpacity onPress={goBack}>
                            <Ionicons name="chevron-back" size={24} color="#2563eb" />
                        </TouchableOpacity>
                        <Text style={styles.stepTitle}>Indtast Scores</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <Text style={styles.stepSubtitle}>
                        Indtast slutscore for hver spiller
                    </Text>

                    {participants.map(participant => (
                        <ScoreInput
                            key={participant.playerId}
                            participant={participant}
                            onScoreChange={updateScore}
                        />
                    ))}

                    <TouchableOpacity
                        style={[
                            styles.nextButton,
                            !participants.every(p => p.score) && styles.nextButtonDisabled
                        ]}
                        onPress={proceedToPreview}
                        disabled={!participants.every(p => p.score)}
                    >
                        <Text style={styles.nextButtonText}>Se Resultat</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}

            {/* Step 3: Preview Results */}
            {step === 3 && (
                <ScrollView style={styles.content}>
                    <View style={styles.stepHeader}>
                        <TouchableOpacity onPress={goBack}>
                            <Ionicons name="chevron-back" size={24} color="#2563eb" />
                        </TouchableOpacity>
                        <Text style={styles.stepTitle}>Bekræft Resultat</Text>
                        <View style={{ width: 24 }} />
                    </View>

                    <ResultPreview participants={participants} />

                    <TouchableOpacity
                        style={styles.saveButton}
                        onPress={saveRound}
                    >
                        <Text style={styles.saveButtonText}>Gem Runde</Text>
                    </TouchableOpacity>
                </ScrollView>
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    centerContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },
    content: {
        flex: 1,
        padding: 16,
    },
    stepHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: 16,
    },
    stepTitle: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 8,
    },
    stepSubtitle: {
        fontSize: 16,
        color: '#64748b',
        marginBottom: 24,
    },
    playerSelector: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#e2e8f0',
    },
    playerSelectorSelected: {
        borderColor: '#2563eb',
        backgroundColor: '#eff6ff',
    },
    selectorContent: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    checkbox: {
        width: 24,
        height: 24,
        borderRadius: 12,
        borderWidth: 2,
        borderColor: '#d1d5db',
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: 12,
    },
    checkboxSelected: {
        backgroundColor: '#2563eb',
        borderColor: '#2563eb',
    },
    selectorText: {
        flex: 1,
        fontSize: 16,
        color: '#374151',
    },
    selectorTextSelected: {
        color: '#1e40af',
        fontWeight: '600',
    },
    badge: {
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        minWidth: 50,
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    scoreInputContainer: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    scoreInputHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    scoreInputName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    scoreInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 18,
        textAlign: 'center',
        backgroundColor: '#f9fafb',
    },
    resultContainer: {
        backgroundColor: 'white',
        padding: 20,
        borderRadius: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 4 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
        elevation: 5,
    },
    resultTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
        textAlign: 'center',
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    resultPlace: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
        width: 30,
    },
    resultName: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
        marginLeft: 8,
    },
    resultScore: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginRight: 16,
    },
    bagtagChange: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bagtagFrom: {
        fontSize: 14,
        color: '#6b7280',
    },
    changeArrow: {
        fontSize: 14,
        fontWeight: 'bold',
        marginHorizontal: 6,
    },
    bagtagTo: {
        fontSize: 14,
        fontWeight: 'bold',
        color: '#1e293b',
    },
    nextButton: {
        backgroundColor: '#2563eb',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginTop: 24,
    },
    nextButtonDisabled: {
        backgroundColor: '#9ca3af',
    },
    nextButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
    saveButton: {
        backgroundColor: '#16a34a',
        padding: 16,
        borderRadius: 12,
        alignItems: 'center',
        marginBottom: 24,
    },
    saveButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
    },
});