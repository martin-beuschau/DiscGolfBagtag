import React, { useState, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Modal,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { storage } from '../utils/storage';
import { getBagtagChanges } from '../utils/bagtagLogic';

const RoundCard = ({ round, onPress }) => {
    const date = new Date(round.date).toLocaleDateString('da-DK', {
        weekday: 'short',
        day: 'numeric',
        month: 'short'
    });

    const winner = round.participants.find(p => p.newBagtag === 1);
    const participantCount = round.participants.length;

    return (
        <TouchableOpacity style={styles.roundCard} onPress={onPress}>
            <View style={styles.roundHeader}>
                <Text style={styles.roundDate}>{date}</Text>
                <Text style={styles.participantCount}>{participantCount} spillere</Text>
            </View>

            <View style={styles.roundInfo}>
                <View style={styles.winnerInfo}>
                    <View style={styles.goldBadge}>
                        <Text style={styles.goldBadgeText}>#1</Text>
                    </View>
                    <Text style={styles.winnerName}>{winner?.playerName || 'N/A'}</Text>
                    <Text style={styles.winnerScore}>({winner?.score})</Text>
                </View>
                <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
            </View>
        </TouchableOpacity>
    );
};

const RoundDetailModal = ({ round, visible, onClose }) => {
    if (!round) return null;

    const changes = getBagtagChanges(round.participants);
    const date = new Date(round.date).toLocaleDateString('da-DK', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric'
    });

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.modalClose}>Luk</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Runde Detaljer</Text>
                    <View style={{ width: 40 }} />
                </View>

                <View style={styles.modalContent}>
                    <Text style={styles.modalDate}>{date}</Text>

                    <View style={styles.resultsContainer}>
                        <Text style={styles.resultsTitle}>Resultat</Text>
                        {changes.map((participant, index) => (
                            <View key={participant.playerId} style={styles.resultRow}>
                                <View style={styles.placeContainer}>
                                    <Text style={styles.place}>{index + 1}.</Text>
                                    {index === 0 && (
                                        <View style={styles.crownContainer}>
                                            <Ionicons name="trophy" size={16} color="#ffd700" />
                                        </View>
                                    )}
                                </View>

                                <Text style={styles.playerName}>{participant.playerName}</Text>
                                <Text style={styles.score}>{participant.score}</Text>

                                <View style={styles.bagtagChangeContainer}>
                                    <Text style={styles.bagtagFrom}>#{participant.oldBagtag}</Text>
                                    <Ionicons
                                        name={getBagtagChangeIcon(participant.changeType)}
                                        size={16}
                                        color={getBagtagChangeColor(participant.changeType)}
                                        style={styles.changeIcon}
                                    />
                                    <Text style={[
                                        styles.bagtagTo,
                                        { color: getBagtagChangeColor(participant.changeType) }
                                    ]}>
                                        #{participant.newBagtag}
                                    </Text>
                                </View>
                            </View>
                        ))}
                    </View>

                    <View style={styles.statsContainer}>
                        <Text style={styles.statsTitle}>Statistik</Text>
                        <View style={styles.statsGrid}>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>{changes.length}</Text>
                                <Text style={styles.statLabel}>Deltagere</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {Math.min(...changes.map(p => p.score))}
                                </Text>
                                <Text style={styles.statLabel}>Bedste Score</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {Math.max(...changes.map(p => p.score))}
                                </Text>
                                <Text style={styles.statLabel}>Værste Score</Text>
                            </View>
                            <View style={styles.statItem}>
                                <Text style={styles.statValue}>
                                    {Math.round(
                                        changes.reduce((sum, p) => sum + p.score, 0) / changes.length
                                    )}
                                </Text>
                                <Text style={styles.statLabel}>Gennemsnit</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </SafeAreaView>
        </Modal>
    );
};

const getBagtagChangeIcon = (changeType) => {
    if (changeType === 'up') return 'trending-up';
    if (changeType === 'down') return 'trending-down';
    return 'remove';
};

const getBagtagChangeColor = (changeType) => {
    if (changeType === 'up') return '#16a34a';
    if (changeType === 'down') return '#dc2626';
    return '#6b7280';
};

export default function HistoryScreen() {
    const [rounds, setRounds] = useState([]);
    const [loading, setLoading] = useState(true);
    const [selectedRound, setSelectedRound] = useState(null);
    const [showModal, setShowModal] = useState(false);

    const loadRounds = async () => {
        try {
            const loadedRounds = await storage.getRounds();
            // Sort by date (newest first)
            const sortedRounds = loadedRounds.sort((a, b) =>
                new Date(b.date) - new Date(a.date)
            );
            setRounds(sortedRounds);
        } catch (error) {
            console.error('Error loading rounds:', error);
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadRounds();
        }, [])
    );

    const handleRoundPress = (round) => {
        setSelectedRound(round);
        setShowModal(true);
    };

    const closeModal = () => {
        setShowModal(false);
        setSelectedRound(null);
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <Text>Indlæser...</Text>
            </View>
        );
    }

    if (rounds.length === 0) {
        return (
            <View style={styles.emptyContainer}>
                <Ionicons name="time-outline" size={64} color="#9ca3af" />
                <Text style={styles.emptyTitle}>Ingen runder endnu</Text>
                <Text style={styles.emptySubtitle}>
                    Registrer din første runde for at se historik
                </Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Runde Historik</Text>
                <Text style={styles.subtitle}>{rounds.length} runder spillet</Text>
            </View>

            <FlatList
                data={rounds}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <RoundCard
                        round={item}
                        onPress={() => handleRoundPress(item)}
                    />
                )}
                style={styles.roundsList}
                showsVerticalScrollIndicator={false}
            />

            <RoundDetailModal
                round={selectedRound}
                visible={showModal}
                onClose={closeModal}
            />
        </View>
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
    emptyContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        padding: 40,
    },
    emptyTitle: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#374151',
        marginTop: 16,
        marginBottom: 8,
    },
    emptySubtitle: {
        fontSize: 16,
        color: '#6b7280',
        textAlign: 'center',
        lineHeight: 24,
    },
    header: {
        padding: 20,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    title: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 4,
    },
    subtitle: {
        fontSize: 16,
        color: '#64748b',
    },
    roundsList: {
        flex: 1,
        padding: 16,
    },
    roundCard: {
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
    roundHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: 12,
    },
    roundDate: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
    },
    participantCount: {
        fontSize: 14,
        color: '#64748b',
    },
    roundInfo: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    winnerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    goldBadge: {
        backgroundColor: '#ffd700',
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: 15,
        marginRight: 12,
    },
    goldBadgeText: {
        color: '#1e293b',
        fontWeight: 'bold',
        fontSize: 12,
    },
    winnerName: {
        fontSize: 16,
        fontWeight: '600',
        color: '#1e293b',
        marginRight: 8,
    },
    winnerScore: {
        fontSize: 14,
        color: '#64748b',
    },
    modalContainer: {
        flex: 1,
        backgroundColor: '#f8fafc',
    },
    modalHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: 16,
        backgroundColor: 'white',
        borderBottomWidth: 1,
        borderBottomColor: '#e2e8f0',
    },
    modalTitle: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
    },
    modalClose: {
        color: '#2563eb',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContent: {
        flex: 1,
        padding: 20,
    },
    modalDate: {
        fontSize: 20,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 24,
        textAlign: 'center',
    },
    resultsContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        marginBottom: 24,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    resultsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
    },
    resultRow: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: 12,
        borderBottomWidth: 1,
        borderBottomColor: '#f1f5f9',
    },
    placeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
        width: 40,
    },
    place: {
        fontSize: 16,
        fontWeight: 'bold',
        color: '#374151',
    },
    crownContainer: {
        marginLeft: 4,
    },
    playerName: {
        flex: 1,
        fontSize: 16,
        color: '#1e293b',
        marginLeft: 8,
    },
    score: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginRight: 16,
        minWidth: 40,
        textAlign: 'right',
    },
    bagtagChangeContainer: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    bagtagFrom: {
        fontSize: 14,
        color: '#6b7280',
    },
    changeIcon: {
        marginHorizontal: 4,
    },
    bagtagTo: {
        fontSize: 14,
        fontWeight: 'bold',
    },
    statsContainer: {
        backgroundColor: 'white',
        borderRadius: 12,
        padding: 16,
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    statsTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        color: '#1e293b',
        marginBottom: 16,
    },
    statsGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'space-between',
    },
    statItem: {
        width: '48%',
        alignItems: 'center',
        marginBottom: 16,
    },
    statValue: {
        fontSize: 24,
        fontWeight: 'bold',
        color: '#2563eb',
        marginBottom: 4,
    },
    statLabel: {
        fontSize: 14,
        color: '#64748b',
        textAlign: 'center',
    },
});