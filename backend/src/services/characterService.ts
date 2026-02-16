// Character interface
export interface Character {
  id: string;
  name: string;
  avatarUrl: string;
}

export class CharacterService {
  private characters: Character[] = [];
  
  // List of colleague names to use as characters
  private colleagues = [
    'Michiel', 'Sid', 'Tissam', 'Frank', 'Wala', 'Ivan', 
    'Kevin', 'Kenny', 'Diogo', 'Liz', 'Maria', 'Louise', 
    'David', 'Tarek', 'Jos', 'Nick', 'Tonny', 'Dries', 
    'Hitesh', 'Giri'
  ];
  
  // Set total characters to match the number of colleagues
  private readonly TOTAL_CHARACTERS = this.colleagues.length;

  // Avatar style for DiceBear API
  private avatarStyle = 'toon-head';

  // Initialize characters
  initializeCharacters(): void {
    this.characters = [];
    
    // Create characters from colleague names
    for (let i = 0; i < this.TOTAL_CHARACTERS; i++) {
      const name = this.colleagues[i];
      const seed = encodeURIComponent(name);
      
      this.characters.push({
        id: `char-${i + 1}`,
        name: name,
        avatarUrl: `https://api.dicebear.com/9.x/${this.avatarStyle}/svg?seed=${seed}`,
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
