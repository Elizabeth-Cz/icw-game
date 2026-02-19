import { Server, Socket } from 'socket.io';
import { RoomService, Player, Room } from '../services/roomService';
import { CharacterService, Character } from '../services/characterService';

// Function to generate random IDs (replacement for uuid)
function generateId(): string {
  return Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
}

// Initialize services
const roomService = new RoomService();
const characterService = new CharacterService();

// Socket event types
export enum SocketEvents {
  CREATE_ROOM = 'create_room',
  ROOM_CREATED = 'room_created',
  JOIN_ROOM = 'join_room',
  ROOM_JOINED = 'room_joined',
  BOTH_PLAYERS_JOINED = 'both_players_joined',
  SUBMIT_NAME = 'submit_name',
  SECRET_CHARACTER_ASSIGNED = 'secret_character_assigned',
  ROOM_ERROR = 'room_error',
  PLAYER_DISCONNECTED = 'player_disconnected',
  REQUEST_RECONNECT = 'request_reconnect',
  RECONNECT_SUCCESS = 'reconnect_success',
  PLAY_AGAIN = 'play_again',
  LEAVE_ROOM = 'leave_room',
  GET_ALL_CHARACTERS = 'get_all_characters',
  ALL_CHARACTERS = 'all_characters',
  REQUEST_SECRET_CHARACTER = 'request_secret_character',
  CHARACTER_ORDER = 'character_order',
}

export const setupSocketHandlers = (io: Server) => {
  // Initialize characters on server startup
  characterService.initializeCharacters();
  
  // Set up room cleanup interval (check every minute, remove rooms inactive for 5 minutes)
  const CLEANUP_INTERVAL_MS = 60 * 1000; // 1 minute
  const ROOM_TIMEOUT_MINUTES = 5; // 5 minutes
  
  setInterval(() => {
    roomService.cleanupInactiveRooms(ROOM_TIMEOUT_MINUTES);
  }, CLEANUP_INTERVAL_MS);

  io.on('connection', (socket: Socket) => {
    console.log(`User connected: ${socket.id}`);

    // Create a new room
    socket.on(SocketEvents.CREATE_ROOM, () => {
      try {
        const roomCode = roomService.generateRoomCode();
        const playerId = generateId();
        const reconnectToken = generateId();

        // Create room with host player
        roomService.createRoom(roomCode, {
          playerId,
          socketId: socket.id,
          reconnectToken,
        });

        // Join socket to room
        socket.join(roomCode);

        // Send room code and reconnect token to client
        socket.emit(SocketEvents.ROOM_CREATED, {
          roomCode,
          playerId,
          reconnectToken,
        });
      } catch (error) {
        console.error('Error creating room:', error);
        socket.emit(SocketEvents.ROOM_ERROR, {
          message: 'Failed to create room',
        });
      }
    });

    // Join an existing room
    socket.on(SocketEvents.JOIN_ROOM, ({ roomCode }) => {
      try {
        // Check if room exists
        if (!roomService.roomExists(roomCode)) {
          return socket.emit(SocketEvents.ROOM_ERROR, {
            message: 'Room does not exist',
          });
        }

        // Check if room is full
        if (roomService.isRoomFull(roomCode)) {
          return socket.emit(SocketEvents.ROOM_ERROR, {
            message: 'Room is full',
          });
        }

        const playerId = generateId();
        const reconnectToken = generateId();

        // Add player to room
        roomService.addPlayerToRoom(roomCode, {
          playerId,
          socketId: socket.id,
          reconnectToken,
        });

        // Join socket to room
        socket.join(roomCode);

        // Send room info to client
        socket.emit(SocketEvents.ROOM_JOINED, {
          roomCode,
          playerId,
          reconnectToken,
        });

        // Notify all players in the room that both players have joined
        io.to(roomCode).emit(SocketEvents.BOTH_PLAYERS_JOINED);
      } catch (error) {
        console.error('Error joining room:', error);
        socket.emit(SocketEvents.ROOM_ERROR, {
          message: 'Failed to join room',
        });
      }
    });

    // Submit player name
    socket.on(SocketEvents.SUBMIT_NAME, ({ roomCode, playerId, name }) => {
      try {
        // Update player name
        roomService.updatePlayerName(roomCode, playerId, name);
        
        // Check if both players have submitted names
        if (roomService.bothPlayersHaveNames(roomCode)) {
          // Set room status to active
          roomService.setRoomStatus(roomCode, 'active');
          
          // Select 20 random characters for this game room
          const gameCharacters = characterService.selectGameCharacters(roomCode);
          
          // Get two random characters from the game characters for secret assignment
          const secretCharacters = [...gameCharacters].sort(() => 0.5 - Math.random()).slice(0, 2);
          
          // Get room
          const room = roomService.getRoom(roomCode);
          if (!room) return;
          
          // Assign secret characters to players
          room.players.forEach((player: Player, index: number) => {
            const secretCharacter = secretCharacters[index];
            roomService.assignSecretCharacter(roomCode, player.playerId, secretCharacter.id);
            
            // Send secret character to each player
            io.to(player.socketId).emit(SocketEvents.SECRET_CHARACTER_ASSIGNED, {
              character: secretCharacter,
            });
          });
          
          // Get game character IDs for shuffling
          const characterIds = gameCharacters.map(char => char.id);
          
          // Create shuffled orders for both players
          roomService.assignShuffledCharacterOrders(roomCode, characterIds);
        }
      } catch (error) {
        console.error('Error submitting name:', error);
        socket.emit(SocketEvents.ROOM_ERROR, {
          message: 'Failed to submit name',
        });
      }
    });

    // Request reconnection
    socket.on(SocketEvents.REQUEST_RECONNECT, ({ reconnectToken }) => {
      try {
        console.log(`Reconnection attempt with token: ${reconnectToken.substring(0, 5)}...`);
        
        // Find room and player by reconnect token
        const { room, player } = roomService.findPlayerByReconnectToken(reconnectToken);
        
        if (!room || !player) {
          console.log('Invalid reconnect token or room/player not found');
          return socket.emit(SocketEvents.ROOM_ERROR, {
            message: 'Invalid reconnect token',
          });
        }
        
        console.log(`Found room ${room.roomCode} for reconnection, player ID: ${player.playerId}`);

        // Update player's socket ID and mark as connected
        roomService.updatePlayerSocketId(room.roomCode, player.playerId, socket.id);
        
        // Join socket to room
        socket.join(room.roomCode);

        // Get player's secret character
        const secretCharacter = player.secretCharacterId 
          ? characterService.getCharacterById(player.secretCharacterId)
          : null;
          
        console.log(`Reconnecting player with secret character: ${secretCharacter?.name || 'none'}`);

        // Send reconnection success to client
        socket.emit(SocketEvents.RECONNECT_SUCCESS, {
          roomCode: room.roomCode,
          playerId: player.playerId,
          name: player.name,
          character: secretCharacter,
          roomStatus: room.status,
        });
        
        // If the player has a character order, request characters to get them in the right order
        if (player.characterOrder && player.characterOrder.length > 0) {
          console.log(`Player has character order, sending characters`);
          // Get the game characters for this room
          const gameCharacters = characterService.getGameCharacters(room.roomCode);
          
          // Create a map of character ID to character object
          const characterMap = gameCharacters.reduce((map, char) => {
            map[char.id] = char;
            return map;
          }, {} as Record<string, Character>);
          
          // Reorder characters based on player's order
          const orderedCharacters = player.characterOrder.map(id => characterMap[id])
            .filter(char => char !== undefined); // Filter out any undefined characters
          
          // Send the ordered characters
          socket.emit(SocketEvents.ALL_CHARACTERS, { characters: orderedCharacters });
        }

        // Notify other player that this player has reconnected
        socket.to(room.roomCode).emit('player_reconnected');
        
        // Update room's last activity timestamp
        room.lastActivity = new Date();
      } catch (error) {
        console.error('Error reconnecting:', error);
        socket.emit(SocketEvents.ROOM_ERROR, {
          message: 'Failed to reconnect',
        });
      }
    });

    // Play again (reset game with new characters)
    socket.on(SocketEvents.PLAY_AGAIN, ({ roomCode, playerId }) => {
      try {
        // Verify player is in the room
        if (!roomService.isPlayerInRoom(roomCode, playerId)) {
          return socket.emit(SocketEvents.ROOM_ERROR, {
            message: 'Player not in room',
          });
        }

        // Get room
        const room = roomService.getRoom(roomCode);
        if (!room) return;
        
        // Clear existing game characters and select 20 new random characters for this room
        characterService.clearGameCharacters(roomCode);
        const gameCharacters = characterService.selectGameCharacters(roomCode);

        // Get two random characters from the game characters for secret assignments
        const secretCharacters = [...gameCharacters].sort(() => 0.5 - Math.random()).slice(0, 2);
        
        // Assign new characters to players
        room.players.forEach((player: Player, index: number) => {
          const secretCharacter = secretCharacters[index];
          roomService.assignSecretCharacter(roomCode, player.playerId, secretCharacter.id);
          
          // Reset character order to force new shuffling
          player.characterOrder = undefined;
          
          // Send new secret character to each player
          io.to(player.socketId).emit(SocketEvents.SECRET_CHARACTER_ASSIGNED, {
            character: secretCharacter,
          });
        });
        
        // Get game character IDs for shuffling
        const characterIds = gameCharacters.map(char => char.id);
        
        // Create new shuffled orders for both players
        roomService.assignShuffledCharacterOrders(roomCode, characterIds);
      } catch (error) {
        console.error('Error playing again:', error);
        socket.emit(SocketEvents.ROOM_ERROR, {
          message: 'Failed to restart game',
        });
      }
    });

    // Leave room
    socket.on(SocketEvents.LEAVE_ROOM, ({ roomCode, playerId }) => {
      try {
        // Remove player from room
        roomService.removePlayerFromRoom(roomCode, playerId);
        
        // Leave socket room
        socket.leave(roomCode);
        
        // Check if room is empty and delete if needed
        if (roomService.isRoomEmpty(roomCode)) {
          roomService.deleteRoom(roomCode);
          // Clear game characters when room is deleted
          characterService.clearGameCharacters(roomCode);
        } else {
          // Notify other player that this player has left
          socket.to(roomCode).emit(SocketEvents.PLAYER_DISCONNECTED);
        }
      } catch (error) {
        console.error('Error leaving room:', error);
      }
    });
    
    // Get all characters for a specific game room
    socket.on(SocketEvents.GET_ALL_CHARACTERS, ({ roomCode, playerId }) => {
      try {
        // Get the room and player
        const room = roomService.getRoom(roomCode);
        if (!room) {
          // If no room is provided or room doesn't exist, send all characters in default order
          const allCharacters = characterService.getAllCharacters();
          return socket.emit(SocketEvents.ALL_CHARACTERS, { characters: allCharacters });
        }
        
        // Find the player
        const player = room.players.find(p => p.playerId === playerId);
        if (!player) {
          const allCharacters = characterService.getAllCharacters();
          return socket.emit(SocketEvents.ALL_CHARACTERS, { characters: allCharacters });
        }
        
        // Get the 20 random characters for this specific game room
        const gameCharacters = characterService.getGameCharacters(roomCode);
        
        // If this is the first time getting characters, create and assign shuffled orders
        if (!player.characterOrder) {
          // Get game character IDs
          const characterIds = gameCharacters.map(char => char.id);
          
          // Assign shuffled orders to both players if not already assigned
          if (!room.players.some(p => p.characterOrder)) {
            roomService.assignShuffledCharacterOrders(roomCode, characterIds);
          }
        }
        
        // If player has a custom order, reorder the characters
        if (player.characterOrder) {
          // Create a map of character ID to character object
          const characterMap = gameCharacters.reduce((map, char) => {
            map[char.id] = char;
            return map;
          }, {} as Record<string, Character>);
          
          // Reorder characters based on player's order
          const orderedCharacters = player.characterOrder.map(id => characterMap[id])
            .filter(char => char !== undefined); // Filter out any undefined characters
          
          // Send the ordered characters
          socket.emit(SocketEvents.ALL_CHARACTERS, { characters: orderedCharacters });
        } else {
          // Send characters in default order if no custom order
          socket.emit(SocketEvents.ALL_CHARACTERS, { characters: gameCharacters });
        }
      } catch (error) {
        console.error('Error getting all characters:', error);
        socket.emit(SocketEvents.ROOM_ERROR, {
          message: 'Failed to get characters',
        });
      }
    });
    
    // Request secret character (for reconnection)
    socket.on(SocketEvents.REQUEST_SECRET_CHARACTER, ({ roomCode, playerId }) => {
      console.log('Received request for secret character:', { roomCode, playerId });
      try {
        // Verify player is in the room
        if (!roomService.isPlayerInRoom(roomCode, playerId)) {
          console.log('Player not in room:', { roomCode, playerId });
          return socket.emit(SocketEvents.ROOM_ERROR, {
            message: 'Player not in room',
          });
        }
        
        // Get player's secret character
        const room = roomService.getRoom(roomCode);
        if (!room) {
          console.log('Room not found:', roomCode);
          return;
        }
        
        console.log('Room found:', { roomCode, players: room.players.map(p => ({ id: p.playerId, hasSecret: !!p.secretCharacterId })) });
        
        const player = room.players.find(p => p.playerId === playerId);
        if (!player) {
          console.log('Player not found in room:', { roomCode, playerId });
          return;
        }
        
        if (!player.secretCharacterId) {
          console.log('Player has no secret character assigned:', { roomCode, playerId });
          return;
        }
        
        // Make sure we have game characters for this room
        const gameCharacters = characterService.getGameCharacters(roomCode);
        
        // First try to find the secret character in the game characters
        let secretCharacter = gameCharacters.find(char => char.id === player.secretCharacterId);
        
        // If not found in game characters (which could happen if the character service was restarted),
        // fall back to all characters
        if (!secretCharacter) {
          secretCharacter = characterService.getCharacterById(player.secretCharacterId);
        }
        
        if (!secretCharacter) {
          console.log('Secret character not found:', { characterId: player.secretCharacterId });
          return;
        }
        
        console.log('Sending secret character to player:', { playerId, characterId: secretCharacter.id });
        
        // Send secret character to player
        socket.emit(SocketEvents.SECRET_CHARACTER_ASSIGNED, {
          character: secretCharacter,
        });
      } catch (error) {
        console.error('Error requesting secret character:', error);
        socket.emit(SocketEvents.ROOM_ERROR, {
          message: 'Failed to get secret character',
        });
      }
    });

    // Handle disconnection
    socket.on('disconnect', () => {
      console.log(`User disconnected: ${socket.id}`);
      
      // Find rooms where this socket is a player
      const roomsWithPlayer = roomService.findRoomsBySocketId(socket.id);
      
      roomsWithPlayer.forEach(({ room, player }: { room: Room; player: Player }) => {
        // Don't remove player, just mark as disconnected for potential reconnection
        roomService.markPlayerDisconnected(room.roomCode, player.playerId);
        
        // Notify other players in the room
        socket.to(room.roomCode).emit(SocketEvents.PLAYER_DISCONNECTED);
      });
    });
  });
};
