import { Express, Request, Response } from 'express';
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

export const registerRoomRoutes = (app: Express) => {
  app.post('/api/rooms/:roomCode/heartbeat', (req: Request, res: Response) => {
    const roomCodeParam = req.params.roomCode;
    const { playerId } = req.body as { playerId?: string };
    const roomCode = Array.isArray(roomCodeParam) ? roomCodeParam[0] : roomCodeParam;

    if (!roomCode) {
      return res.status(400).json({ ok: false, message: 'roomCode is required' });
    }

    if (!playerId) {
      return res.status(400).json({ ok: false, message: 'playerId is required' });
    }

    const room = roomService.getRoom(roomCode);
    if (!room) {
      return res.status(404).json({ ok: false, message: 'Room not found' });
    }

    const player = room.players.find(currentPlayer => currentPlayer.playerId === playerId);
    if (!player) {
      return res.status(410).json({ ok: false, message: 'Player not found in room' });
    }

    roomService.recordPlayerActivity(roomCode, playerId);
    const status = roomService.getHeartbeatStatus(roomCode, playerId);

    return res.status(200).json({
      ok: true,
      ...status,
    });
  });
};

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
  LEAVE_ROOM = 'leave_room',
  GET_ALL_CHARACTERS = 'get_all_characters',
  ALL_CHARACTERS = 'all_characters',
  REQUEST_SECRET_CHARACTER = 'request_secret_character',
  CHARACTER_ORDER = 'character_order',
}

// Helper functions
function handleError(socket: Socket, message: string, error?: any) {
  if (error) console.error(`${message}:`, error);
  socket.emit(SocketEvents.ROOM_ERROR, { message });
}

function assignCharactersToPlayers(io: Server, roomCode: string, playersNeedingCharacters: Player[], gameCharacters: Character[]) {
  if (playersNeedingCharacters.length === 0) return;
  
  const availableCharacters = [...gameCharacters];
  const secretCharacters = availableCharacters
    .sort(() => 0.5 - Math.random())
    .slice(0, playersNeedingCharacters.length);
  
  playersNeedingCharacters.forEach((player: Player, index: number) => {
    const secretCharacter = secretCharacters[index];
    roomService.assignSecretCharacter(roomCode, player.playerId, secretCharacter.id);
    
    io.to(player.socketId).emit(SocketEvents.SECRET_CHARACTER_ASSIGNED, {
      character: secretCharacter,
    });
  });
}

function getOrderedCharacters(gameCharacters: Character[], characterOrder: string[]) {
  const characterMap = gameCharacters.reduce((map, char) => {
    map[char.id] = char;
    return map;
  }, {} as Record<string, Character>);
  
  return characterOrder
    .map(id => characterMap[id])
    .filter(char => char !== undefined);
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
        handleError(socket, 'Failed to create room', error);
      }
    });

    // Join an existing room
    socket.on(SocketEvents.JOIN_ROOM, ({ roomCode }) => {
      try {
        // Check if room exists
        if (!roomService.roomExists(roomCode)) {
          return handleError(socket, 'Room does not exist');
        }

        // Check if room is full
        if (roomService.isRoomFull(roomCode)) {
          return handleError(socket, 'Room is full');
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
        handleError(socket, 'Failed to join room', error);
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
          
          // Get room
          const room = roomService.getRoom(roomCode);
          if (!room) return;
          
          // Select 20 random characters for this game room if not already selected
          const gameCharacters = characterService.getGameCharacters(roomCode);
          
          // Track which players need character assignment
          const playersNeedingCharacters = room.players.filter(player => !player.secretCharacterId);
          
          // Assign characters to players who need them
          assignCharactersToPlayers(io, roomCode, playersNeedingCharacters, gameCharacters);
          
          // Get game character IDs for shuffling
          const characterIds = gameCharacters.map(char => char.id);
          
          // Create shuffled orders for players who don't have them yet
          if (!room.players[0].characterOrder || !room.players[1].characterOrder) {
            roomService.assignShuffledCharacterOrders(roomCode, characterIds);
          }
        }
      } catch (error) {
        handleError(socket, 'Failed to submit name', error);
      }
    });

    // Request reconnection
    socket.on(SocketEvents.REQUEST_RECONNECT, ({ reconnectToken }) => {
      try {
        // Find room and player by reconnect token
        const { room, player } = roomService.findPlayerByReconnectToken(reconnectToken);
        
        if (!room || !player) {
          return handleError(socket, 'Invalid reconnect token');
        }

        // Update player's socket ID and mark as connected
        roomService.updatePlayerSocketId(room.roomCode, player.playerId, socket.id);
        
        // Join socket to room
        socket.join(room.roomCode);

        // Get player's secret character
        const secretCharacter = player.secretCharacterId 
          ? characterService.getCharacterById(player.secretCharacterId)
          : null;

        // Send reconnection success to client
        socket.emit(SocketEvents.RECONNECT_SUCCESS, {
          roomCode: room.roomCode,
          playerId: player.playerId,
          name: player.name,
          character: secretCharacter,
          roomStatus: room.status,
        });
        
        // If the player has a character order, send ordered characters
        if (player.characterOrder && player.characterOrder.length > 0) {
          const gameCharacters = characterService.getGameCharacters(room.roomCode);
          const orderedCharacters = getOrderedCharacters(gameCharacters, player.characterOrder);
          socket.emit(SocketEvents.ALL_CHARACTERS, { characters: orderedCharacters });
        }

        // Notify other player that this player has reconnected
        socket.to(room.roomCode).emit('player_reconnected');
        
        roomService.recordPlayerActivity(room.roomCode, player.playerId);
      } catch (error) {
        handleError(socket, 'Failed to reconnect', error);
      }
    });

    // Play Again functionality removed

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
        // Just log the error, no need to send to client as they're leaving
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
        roomService.recordPlayerActivity(roomCode, playerId);
        
        // If this is the first time getting characters, create and assign shuffled orders
        if (!player.characterOrder) {
          // Get game character IDs
          const characterIds = gameCharacters.map(char => char.id);
          
          // Assign shuffled orders to both players if not already assigned
          if (!room.players.some(p => p.characterOrder)) {
            roomService.assignShuffledCharacterOrders(roomCode, characterIds);
          }
        }
        
        // Send ordered characters if player has a custom order, otherwise send default order
        if (player.characterOrder) {
          const orderedCharacters = getOrderedCharacters(gameCharacters, player.characterOrder);
          socket.emit(SocketEvents.ALL_CHARACTERS, { characters: orderedCharacters });
        } else {
          socket.emit(SocketEvents.ALL_CHARACTERS, { characters: gameCharacters });
        }
      } catch (error) {
        handleError(socket, 'Failed to get characters', error);
      }
    });
    
    // Request secret character (for reconnection)
    socket.on(SocketEvents.REQUEST_SECRET_CHARACTER, ({ roomCode, playerId }) => {
      try {
        // Verify player is in the room
        if (!roomService.isPlayerInRoom(roomCode, playerId)) {
          return handleError(socket, 'Player not in room');
        }
        
        // Get player's secret character
        const room = roomService.getRoom(roomCode);
        if (!room) return;
        
        const player = room.players.find(p => p.playerId === playerId);
        if (!player || !player.secretCharacterId) return;
        roomService.recordPlayerActivity(roomCode, playerId);
        
        // Make sure we have game characters for this room
        const gameCharacters = characterService.getGameCharacters(roomCode);
        
        // First try to find the secret character in the game characters
        let secretCharacter = gameCharacters.find(char => char.id === player.secretCharacterId);
        
        // If not found in game characters, fall back to all characters
        if (!secretCharacter) {
          secretCharacter = characterService.getCharacterById(player.secretCharacterId);
        }
        
        if (!secretCharacter) return;
        
        // Send secret character to player
        socket.emit(SocketEvents.SECRET_CHARACTER_ASSIGNED, {
          character: secretCharacter,
        });
      } catch (error) {
        handleError(socket, 'Failed to get secret character', error);
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
