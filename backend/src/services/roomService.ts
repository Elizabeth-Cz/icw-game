// Room and Player interfaces
export interface Player {
  playerId: string;
  socketId: string;
  name?: string;
  secretCharacterId?: string;
  reconnectToken: string;
  connected: boolean;
  lastSeenAt: Date;
  characterOrder?: string[]; // Array of character IDs in player-specific order
}

export interface Room {
  roomCode: string;
  players: Player[];
  status: 'waiting' | 'active';
  createdAt: Date;
  lastActivity: Date;
}

export class RoomService {
  private rooms: Record<string, Room> = {};

  private touchRoom(room: Room): void {
    room.lastActivity = new Date();
  }

  private touchPlayer(room: Room, player: Player): void {
    const now = new Date();
    player.lastSeenAt = now;
    room.lastActivity = now;
  }

  // Generate a random 4-digit room code
  generateRoomCode(): string {
    const min = 1000;
    const max = 9999;
    let roomCode: string;

    do {
      roomCode = Math.floor(Math.random() * (max - min + 1) + min).toString();
    } while (this.roomExists(roomCode));

    return roomCode;
  }

  // Check if a room exists
  roomExists(roomCode: string): boolean {
    return !!this.rooms[roomCode];
  }

  // Create a new room
  createRoom(roomCode: string, player: Omit<Player, 'connected' | 'lastSeenAt'>): Room {
    const now = new Date();
    const room: Room = {
      roomCode,
      players: [{
        ...player,
        connected: true,
        lastSeenAt: now,
      }],
      status: 'waiting',
      createdAt: now,
      lastActivity: now,
    };

    this.rooms[roomCode] = room;
    return room;
  }

  // Get a room by code
  getRoom(roomCode: string): Room | undefined {
    return this.rooms[roomCode];
  }

  // Check if a room is full (has 2 players)
  isRoomFull(roomCode: string): boolean {
    const room = this.getRoom(roomCode);
    return room ? room.players.length >= 2 : false;
  }

  // Add a player to a room
  addPlayerToRoom(roomCode: string, player: Omit<Player, 'connected' | 'lastSeenAt'>): void {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    if (this.isRoomFull(roomCode)) throw new Error('Room is full');

    room.players.push({
      ...player,
      connected: true,
      lastSeenAt: new Date(),
    });
    this.touchRoom(room);
  }

  // Update a player's name
  updatePlayerName(roomCode: string, playerId: string, name: string): void {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) throw new Error('Player not found');

    player.name = name;
    this.touchPlayer(room, player);
  }

  // Check if both players have names
  bothPlayersHaveNames(roomCode: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room) return false;
    if (room.players.length !== 2) return false;

    return room.players.every(player => !!player.name);
  }

  // Assign a secret character to a player
  assignSecretCharacter(roomCode: string, playerId: string, characterId: string): void {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) throw new Error('Player not found');

    player.secretCharacterId = characterId;
    this.touchPlayer(room, player);
  }

  // Set room status
  setRoomStatus(roomCode: string, status: 'waiting' | 'active'): void {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    room.status = status;
    this.touchRoom(room);
  }

  // Find a player by reconnect token
  findPlayerByReconnectToken(reconnectToken: string): { room: Room; player: Player } | { room: undefined; player: undefined } {
    for (const roomCode in this.rooms) {
      const room = this.rooms[roomCode];
      const player = room.players.find(p => p.reconnectToken === reconnectToken);
      
      if (player) {
        return { room, player };
      }
    }

    return { room: undefined, player: undefined };
  }

  // Update player's socket ID
  updatePlayerSocketId(roomCode: string, playerId: string, socketId: string): void {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) throw new Error('Player not found');

    player.socketId = socketId;
    player.connected = true;
    this.touchPlayer(room, player);
  }

  // Check if a player is in a room
  isPlayerInRoom(roomCode: string, playerId: string): boolean {
    const room = this.getRoom(roomCode);
    if (!room) return false;

    return room.players.some(p => p.playerId === playerId);
  }

  // Remove a player from a room
  removePlayerFromRoom(roomCode: string, playerId: string): void {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    room.players = room.players.filter(p => p.playerId !== playerId);
    this.touchRoom(room);
  }

  // Check if a room is empty
  isRoomEmpty(roomCode: string): boolean {
    const room = this.getRoom(roomCode);
    return room ? room.players.length === 0 : true;
  }

  // Delete a room
  deleteRoom(roomCode: string): void {
    delete this.rooms[roomCode];
  }

  // Find rooms by socket ID
  findRoomsBySocketId(socketId: string): Array<{ room: Room; player: Player }> {
    const result: Array<{ room: Room; player: Player }> = [];

    for (const roomCode in this.rooms) {
      const room = this.rooms[roomCode];
      const player = room.players.find(p => p.socketId === socketId);
      
      if (player) {
        result.push({ room, player });
      }
    }

    return result;
  }

  // Mark a player as disconnected
  markPlayerDisconnected(roomCode: string, playerId: string): void {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) throw new Error('Player not found');

    player.connected = false;
    this.touchRoom(room);
  }

  // Record activity for a player in a room
  recordPlayerActivity(roomCode: string, playerId: string): { room: Room; player: Player } {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) throw new Error('Player not found');

    this.touchPlayer(room, player);
    return { room, player };
  }

  // Get room heartbeat status for a player
  getHeartbeatStatus(roomCode: string, playerId: string): { roomStatus: Room['status']; opponentConnected: boolean } {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');

    const player = room.players.find(p => p.playerId === playerId);
    if (!player) throw new Error('Player not found');

    const opponentConnected = room.players.some(
      currentPlayer => currentPlayer.playerId !== playerId && currentPlayer.connected,
    );

    return {
      roomStatus: room.status,
      opponentConnected,
    };
  }

  // Clean up inactive rooms and handle disconnected players
  cleanupInactiveRooms(maxInactivityMinutes: number = 5): void {
    const now = new Date();
    console.log(`Running room cleanup, checking for rooms inactive for ${maxInactivityMinutes} minutes...`);
    
    for (const roomCode in this.rooms) {
      const room = this.rooms[roomCode];
      const latestPlayerActivity = room.players.reduce((latest, player) => {
        return Math.max(latest, player.lastSeenAt.getTime());
      }, room.lastActivity.getTime());
      const inactiveMinutes = (now.getTime() - latestPlayerActivity) / (1000 * 60);
      
      // Check if all players are disconnected
      const allDisconnected = room.players.length > 0 && room.players.every(p => !p.connected);
      
      // Log room status
      console.log(`Room ${roomCode}: inactive for ${inactiveMinutes.toFixed(1)} minutes, all disconnected: ${allDisconnected}`);
      
      // Delete room if it's been inactive for too long
      if (inactiveMinutes >= maxInactivityMinutes) {
        console.log(`Deleting inactive room ${roomCode} (inactive for ${inactiveMinutes.toFixed(1)} minutes)`);
        this.deleteRoom(roomCode);
      }
    }
  }
  
  // Assign shuffled character orders to players
  assignShuffledCharacterOrders(roomCode: string, characterIds: string[]): void {
    const room = this.getRoom(roomCode);
    if (!room) throw new Error('Room not found');
    if (room.players.length !== 2) throw new Error('Room must have exactly 2 players');
    
    // Create a shuffled order for player 1
    const player1Order = [...characterIds].sort(() => 0.5 - Math.random());
    
    // Create a different shuffled order for player 2
    const player2Order = [...characterIds].sort(() => 0.5 - Math.random());
    
    // Assign the orders to the players
    room.players[0].characterOrder = player1Order;
    room.players[1].characterOrder = player2Order;
    
    this.touchRoom(room);
  }
}
