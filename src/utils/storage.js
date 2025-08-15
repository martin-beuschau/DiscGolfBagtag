import { MMKV } from 'react-native-mmkv';

const mmkv = new MMKV();

// Storage utilities
export const storage = {
    // Players
    getPlayers() {
        try {
            const playersJson = mmkv.getString('players');
            return playersJson ? JSON.parse(playersJson) : [];
        } catch (error) {
            console.error('Error loading players:', error);
            return [];
        }
    },

    savePlayers(players) {
        try {
            mmkv.set('players', JSON.stringify(players));
        } catch (error) {
            console.error('Error saving players:', error);
        }
    },

    // Rounds
    getRounds() {
        try {
            const roundsJson = mmkv.getString('rounds');
            return roundsJson ? JSON.parse(roundsJson) : [];
        } catch (error) {
            console.error('Error loading rounds:', error);
            return [];
        }
    },

    saveRounds(rounds) {
        try {
            mmkv.set('rounds', JSON.stringify(rounds));
        } catch (error) {
            console.error('Error saving rounds:', error);
        }
    },

    // Clear all data (for development)
    clearAll() {
        try {
            mmkv.clearAll();
        } catch (error) {
            console.error('Error clearing storage:', error);
        }
    }
};

// Initialize with mock data if storage is empty
export const initializeData = () => {
    const players = storage.getPlayers();
    const rounds = storage.getRounds();

    if (players.length === 0) {
        const mockPlayers = [
            { id: '1', name: 'Lars', currentBagtag: 1, joinDate: '2025-01-01' },
            { id: '2', name: 'Thacker', currentBagtag: 2, joinDate: '2025-01-01' },
            { id: '3', name: 'Morten', currentBagtag: 3, joinDate: '2025-01-01' },
            { id: '4', name: 'Espholm', currentBagtag: 4, joinDate: '2025-01-05' },
            { id: '5', name: 'Beuschau', currentBagtag: 5, joinDate: '2025-01-10' },
        ];
        storage.savePlayers(mockPlayers);
    }

    if (rounds.length === 0) {
        const mockRounds = [
            {
                id: '1',
                date: '2025-01-15',
                participants: [
                    { playerId: '1', playerName: 'Lars', score: 55, oldBagtag: 1, newBagtag: 2 },
                    { playerId: '2', playerName: 'Mette', score: 52, oldBagtag: 2, newBagtag: 1 },
                    { playerId: '3', playerName: 'Peter', score: 58, oldBagtag: 3, newBagtag: 3 },
                ]
            }
        ];
        storage.saveRounds(mockRounds);
    }
};