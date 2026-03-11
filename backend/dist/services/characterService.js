"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.CharacterService = void 0;
exports.createCharacter = createCharacter;
// Character creation helper function
function createCharacter(id, name) {
    return {
        id,
        name,
        avatarUrl: name
    };
}
class CharacterService {
    constructor() {
        this.characters = [];
        this.gameCharacters = {}; // Store characters for each game room
        // List of colleague names to use as characters - exact match with PNG filenames in assets folder
        this.colleagues = [
            'Alex', 'Anna', 'Brian', 'David', 'Diogo', 'Dries',
            'Elouan', 'Frank', 'Giri', 'Hitesh', 'Ivan', 'Ivana',
            'Jeeshan', 'Jesse', 'Jos', 'Karl', 'Kevin',
            'Linh', 'Liz', 'Louise', 'Luc', 'Maria', 'Michiel',
            'Mike', 'Nick', 'Ralph', 'Sid', 'Kenny', 'Tarek', 'Tissam', 'Tonny',
            'Wala'
        ];
        // Set total characters to match the number of colleagues
        this.TOTAL_CHARACTERS = this.colleagues.length;
        // Number of characters to display in each game
        this.GAME_CHARACTERS_COUNT = 20;
    }
    ensureCharactersInitialized() {
        if (this.characters.length === 0) {
            this.initializeCharacters();
        }
    }
    // Initialize all possible characters
    initializeCharacters() {
        this.characters = [];
        // Create characters from colleague names using the constructor function
        for (let i = 0; i < this.TOTAL_CHARACTERS; i++) {
            const name = this.colleagues[i];
            this.characters.push(createCharacter(`char-${i + 1}`, name));
        }
        console.log(`Initialized ${this.characters.length} characters`);
    }
    // Select 20 random characters for a specific game room
    selectGameCharacters(roomCode) {
        // If we've already selected characters for this room, return them
        if (this.gameCharacters[roomCode]) {
            return this.gameCharacters[roomCode];
        }
        // Make sure all characters are initialized
        this.ensureCharactersInitialized();
        // Randomly select 20 characters from the full set
        const shuffled = [...this.characters].sort(() => 0.5 - Math.random());
        const selectedCharacters = shuffled.slice(0, this.GAME_CHARACTERS_COUNT);
        // Store the selected characters for this room
        this.gameCharacters[roomCode] = selectedCharacters;
        console.log(`Selected ${selectedCharacters.length} characters for room ${roomCode}`);
        return selectedCharacters;
    }
    // Get characters for a specific game room
    getGameCharacters(roomCode) {
        // If we don't have characters for this room yet, select them
        if (!this.gameCharacters[roomCode]) {
            return this.selectGameCharacters(roomCode);
        }
        return this.gameCharacters[roomCode];
    }
    // Clear game characters for a specific room
    clearGameCharacters(roomCode) {
        delete this.gameCharacters[roomCode];
        console.log(`Cleared game characters for room ${roomCode}`);
    }
    // Get all characters
    getAllCharacters() {
        // Make sure all characters are initialized
        this.ensureCharactersInitialized();
        return this.characters;
    }
    // Get a character by ID
    getCharacterById(characterId) {
        // Make sure all characters are initialized
        this.ensureCharactersInitialized();
        return this.characters.find(char => char.id === characterId);
    }
}
exports.CharacterService = CharacterService;
