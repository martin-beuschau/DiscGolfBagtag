// Generate unique ID
export const generateId = () => {
    return Date.now().toString() + Math.random().toString(36).slice(2, 11);
};

// Add new player with next highest bagtag
export const addNewPlayer = (name, existingPlayers) => {
    const highestBagtag = existingPlayers.length > 0
        ? Math.max(...existingPlayers.map(p => p.currentBagtag))
        : 0;

    return {
        id: generateId(),
        name: name.trim(),
        currentBagtag: highestBagtag + 1,
        joinDate: new Date().toISOString().split('T')[0]
    };
};

// Main bagtag redistribution logic
export const redistributeBagtags = (roundResults) => {
    // Sort by score ascending (lowest score = best performance)
    const sortedByPerformance = [...roundResults].sort((a, b) => {
        if (a.score === b.score) {
            // Tie-breaker: lower current bagtag wins
            return a.currentBagtag - b.currentBagtag;
        }
        return a.score - b.score; // Lower score is better in disc golf
    });

    console.log('Sorted by performance (best to worst):', sortedByPerformance);

    // Get all participating bagtags sorted from lowest to highest
    const availableBagtags = roundResults
        .map(participant => participant.currentBagtag)
        .sort((a, b) => a - b);

    console.log('Available bagtags:', availableBagtags);

    // Assign bagtags: best performer gets lowest bagtag number
    const redistributed = sortedByPerformance.map((participant, index) => ({
        ...participant,
        newBagtag: availableBagtags[index]
    }));

    console.log('After redistribution:', redistributed);

    // Return sorted by final bagtag ranking (1, 2, 3...)
    const finalResult = redistributed.sort((a, b) => a.newBagtag - b.newBagtag);
    console.log('Final sorted result:', finalResult);

    return finalResult;
};

// Create a new round and update player bagtags
export const processNewRound = (participants, players) => {
    // Redistribute bagtags
    const redistributed = redistributeBagtags(participants);

    // Create round object
    const round = {
        id: generateId(),
        date: new Date().toISOString().split('T')[0],
        participants: redistributed
    };

    // Update players with new bagtags
    const updatedPlayers = players.map(player => {
        const participant = redistributed.find(p => p.playerId === player.id);
        if (participant) {
            return {
                ...player,
                currentBagtag: participant.newBagtag
            };
        }
        return player;
    });

    return { round, updatedPlayers };
};

// Get bagtag change summary for display
export const getBagtagChanges = (participants) => {
    return participants.map(p => {
        const change = p.newBagtag - p.oldBagtag;
        let changeType = 'same';
        let changeText = '→';

        if (change < 0) {
            changeType = 'up';
            changeText = `↑${Math.abs(change)}`;
        } else if (change > 0) {
            changeType = 'down';
            changeText = `↓${change}`;
        }

        return {
            ...p,
            change,
            changeType,
            changeText
        };
    });
};

// Validate round participants
export const validateRound = (participants) => {
    const errors = [];

    if (participants.length < 2) {
        errors.push('Mindst 2 spillere skal deltage');
    }

    participants.forEach(p => {
        if (!p.score || p.score < 18 || p.score > 200) {
            errors.push(`${p.playerName}: Score skal være mellem 18-200`);
        }
    });

    const duplicateScores = participants.filter((p, index) =>
        participants.findIndex(p2 => p2.score === p.score) !== index
    );

    if (duplicateScores.length > 0) {
        // This is allowed, just noting for tie-breaker logic
    }

    return errors;
};