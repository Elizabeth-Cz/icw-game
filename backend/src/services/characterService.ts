// Character interface
export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
}

export class CharacterService {
  private characters: Character[] = [];
  private readonly TOTAL_CHARACTERS = 24;

  // First names for random generation
  private firstNames = [
    'Emma', 'Liam', 'Olivia', 'Noah', 'Ava', 'William', 'Sophia', 'James',
    'Isabella', 'Logan', 'Charlotte', 'Benjamin', 'Amelia', 'Mason', 'Mia',
    'Elijah', 'Harper', 'Oliver', 'Evelyn', 'Jacob', 'Abigail', 'Lucas',
    'Emily', 'Michael', 'Elizabeth', 'Alexander', 'Sofia', 'Ethan', 'Avery',
    'Daniel', 'Ella', 'Matthew', 'Scarlett', 'Henry', 'Grace', 'Joseph',
    'Chloe', 'Jackson', 'Victoria', 'Samuel', 'Riley', 'Sebastian', 'Aria',
    'David', 'Lily', 'Carter', 'Aubrey', 'Wyatt', 'Zoey', 'Jayden', 'Penelope'
  ];

  // Last names for random generation
  private lastNames = [
    'Smith', 'Johnson', 'Williams', 'Jones', 'Brown', 'Davis', 'Miller', 'Wilson',
    'Moore', 'Taylor', 'Anderson', 'Thomas', 'Jackson', 'White', 'Harris', 'Martin',
    'Thompson', 'Garcia', 'Martinez', 'Robinson', 'Clark', 'Rodriguez', 'Lewis', 'Lee',
    'Walker', 'Hall', 'Allen', 'Young', 'Hernandez', 'King', 'Wright', 'Lopez',
    'Hill', 'Scott', 'Green', 'Adams', 'Baker', 'Gonzalez', 'Nelson', 'Carter',
    'Mitchell', 'Perez', 'Roberts', 'Turner', 'Phillips', 'Campbell', 'Parker', 'Evans',
    'Edwards', 'Collins', 'Stewart', 'Sanchez', 'Morris', 'Rogers', 'Reed', 'Cook'
  ];

  // Avatar styles for DiceBear API
  private avatarStyles = ['toon-head'];

  // Initialize characters
  initializeCharacters(): void {
    this.characters = [];
    const usedNames = new Set<string>();

    for (let i = 0; i < this.TOTAL_CHARACTERS; i++) {
      let fullName: string;
      
      // Ensure unique names
      do {
        const firstName = this.getRandomItem(this.firstNames);
        const lastName = this.getRandomItem(this.lastNames);
        fullName = `${firstName} ${lastName}`;
      } while (usedNames.has(fullName));
      
      usedNames.add(fullName);
      
      // Generate avatar URL using DiceBear API
      // const style = this.getRandomItem(this.avatarStyles);
      const seed = encodeURIComponent(fullName);
      const avatarUrl = `https://api.dicebear.com/9.x/toon-head/svg?seed=${seed}`;
      
      this.characters.push({
        id: `char-${i + 1}`,
        name: fullName,
        avatarUrl,
      });
    }
  }

  // Get all characters
  getAllCharacters(): Character[] {
    return [...this.characters];
  }

  // Get a character by ID
  getCharacterById(id: string): Character | undefined {
    return this.characters.find(char => char.id === id);
  }

  // Get random characters
  getRandomCharacters(count: number): Character[] {
    if (count > this.characters.length) {
      throw new Error(`Cannot get ${count} characters, only ${this.characters.length} available`);
    }

    // Shuffle array and take first 'count' elements
    const shuffled = [...this.characters].sort(() => 0.5 - Math.random());
    return shuffled.slice(0, count);
  }

  // Helper to get a random item from an array
  private getRandomItem<T>(array: T[]): T {
    return array[Math.floor(Math.random() * array.length)];
  }
}
