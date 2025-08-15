import React, { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    FlatList,
    TouchableOpacity,
    StyleSheet,
    Alert,
    TextInput,
    Modal,
    SafeAreaView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from '@react-navigation/native';

import { storage, initializeData } from '../utils/storage';
import { addNewPlayer } from '../utils/bagtagLogic';

const BagtagBadge = ({ bagtag, size = 'normal' }) => {
    const badgeStyle = size === 'large' ? styles.badgeLarge : styles.badge;
    const textStyle = size === 'large' ? styles.badgeTextLarge : styles.badgeText;

    return (
        <View style={[badgeStyle, { backgroundColor: getBagtagColor(bagtag) }]}>
            <Text style={textStyle}>#{bagtag}</Text>
        </View>
    );
};

const getBagtagColor = (bagtag) => {
    if (bagtag === 1) return '#ffd700'; // Gold
    if (bagtag === 2) return '#c0c0c0'; // Silver
    if (bagtag === 3) return '#cd7f32'; // Bronze
    if (bagtag <= 5) return '#3b82f6'; // Blue
    return '#6b7280'; // Gray
};

const PlayerCard = ({ player, onPress }) => (
    <TouchableOpacity style={styles.playerCard} onPress={onPress}>
        <View style={styles.playerInfo}>
            <BagtagBadge bagtag={player.currentBagtag} />
            <Text style={styles.playerName}>{player.name}</Text>
        </View>
        <Ionicons name="chevron-forward" size={20} color="#9ca3af" />
    </TouchableOpacity>
);

const AddPlayerModal = ({ visible, onClose, onAdd }) => {
    const [name, setName] = useState('');

    const handleAdd = () => {
        if (name.trim()) {
            onAdd(name.trim());
            setName('');
            onClose();
        }
    };

    return (
        <Modal
            visible={visible}
            animationType="slide"
            presentationStyle="pageSheet"
        >
            <SafeAreaView style={styles.modalContainer}>
                <View style={styles.modalHeader}>
                    <TouchableOpacity onPress={onClose}>
                        <Text style={styles.modalCancel}>Annuller</Text>
                    </TouchableOpacity>
                    <Text style={styles.modalTitle}>Tilføj Spiller</Text>
                    <TouchableOpacity onPress={handleAdd}>
                        <Text style={styles.modalSave}>Gem</Text>
                    </TouchableOpacity>
                </View>

                <View style={styles.modalContent}>
                    <Text style={styles.inputLabel}>Spillernavn</Text>
                    <TextInput
                        style={styles.textInput}
                        value={name}
                        onChangeText={setName}
                        placeholder="Indtast navn..."
                        autoFocus
                        onSubmitEditing={handleAdd}
                    />
                </View>
            </SafeAreaView>
        </Modal>
    );
};

export default function HomeScreen() {
    const [players, setPlayers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [showAddPlayer, setShowAddPlayer] = useState(false);

    const loadPlayers = async () => {
        try {
            await initializeData();
            const loadedPlayers = await storage.getPlayers();
            // Sort by bagtag number
            const sortedPlayers = loadedPlayers.sort((a, b) => a.currentBagtag - b.currentBagtag);
            setPlayers(sortedPlayers);
        } catch (error) {
            console.error('Error loading players:', error);
            Alert.alert('Fejl', 'Kunne ikke indlæse spillere');
        } finally {
            setLoading(false);
        }
    };

    useFocusEffect(
        useCallback(() => {
            loadPlayers();
        }, [])
    );

    const handleAddPlayer = async (name) => {
        try {
            const newPlayer = addNewPlayer(name, players);
            const updatedPlayers = [...players, newPlayer];
            await storage.savePlayers(updatedPlayers);
            setPlayers(updatedPlayers.sort((a, b) => a.currentBagtag - b.currentBagtag));
            console.log('players:', players);
        } catch (error) {
            console.error('Error adding player:', error);
            Alert.alert('Fejl', 'Kunne ikke tilføje spiller');
        }
    };

    const handlePlayerPress = (player) => {
        Alert.alert(
            player.name,
            `Bagtag: #${player.currentBagtag}\nTilsluttet: ${player.joinDate}`,
            [{ text: 'OK' }]
        );
    };

    if (loading) {
        return (
            <View style={styles.centerContainer}>
                <Text>Indlæser...</Text>
            </View>
        );
    }

    return (
        <View style={styles.container}>
            <View style={styles.header}>
                <Text style={styles.title}>Bagtag Oversigt</Text>
                <Text style={styles.subtitle}>{players.length} spillere</Text>
            </View>

            <FlatList
                data={players}
                keyExtractor={(item) => item.id}
                renderItem={({ item }) => (
                    <PlayerCard
                        player={item}
                        onPress={() => handlePlayerPress(item)}
                    />
                )}
                style={styles.playerList}
                showsVerticalScrollIndicator={false}
            />

            <TouchableOpacity
                style={styles.addButton}
                onPress={() => setShowAddPlayer(true)}
            >
                <Ionicons name="add" size={24} color="white" />
                <Text style={styles.addButtonText}>Tilføj Spiller</Text>
            </TouchableOpacity>

            <AddPlayerModal
                visible={showAddPlayer}
                onClose={() => setShowAddPlayer(false)}
                onAdd={handleAddPlayer}
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
    playerList: {
        flex: 1,
        padding: 16,
    },
    playerCard: {
        backgroundColor: 'white',
        padding: 16,
        marginBottom: 12,
        borderRadius: 12,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        shadowColor: '#000',
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 4,
        elevation: 3,
    },
    playerInfo: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    playerName: {
        fontSize: 18,
        fontWeight: '600',
        color: '#1e293b',
        marginLeft: 12,
    },
    badge: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 20,
        minWidth: 50,
        alignItems: 'center',
    },
    badgeLarge: {
        backgroundColor: '#3b82f6',
        paddingHorizontal: 16,
        paddingVertical: 8,
        borderRadius: 25,
        minWidth: 60,
        alignItems: 'center',
    },
    badgeText: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 14,
    },
    badgeTextLarge: {
        color: 'white',
        fontWeight: 'bold',
        fontSize: 16,
    },
    addButton: {
        backgroundColor: '#2563eb',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        margin: 16,
        padding: 16,
        borderRadius: 12,
    },
    addButtonText: {
        color: 'white',
        fontSize: 16,
        fontWeight: '600',
        marginLeft: 8,
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
    modalCancel: {
        color: '#64748b',
        fontSize: 16,
    },
    modalSave: {
        color: '#2563eb',
        fontSize: 16,
        fontWeight: '600',
    },
    modalContent: {
        padding: 20,
    },
    inputLabel: {
        fontSize: 16,
        fontWeight: '600',
        color: '#374151',
        marginBottom: 8,
    },
    textInput: {
        borderWidth: 1,
        borderColor: '#d1d5db',
        borderRadius: 8,
        padding: 12,
        fontSize: 16,
        backgroundColor: 'white',
    },
});