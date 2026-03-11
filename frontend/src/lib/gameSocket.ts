import { Socket } from 'socket.io-client';

export type RoomPlayerPayload = {
  roomCode: string;
  playerId: string;
};

export const emitSubmitName = (
  socket: Socket,
  payload: RoomPlayerPayload & { name: string },
) => {
  socket.emit('submit_name', payload);
};

export const emitLeaveRoom = (socket: Socket, payload: RoomPlayerPayload) => {
  socket.emit('leave_room', payload);
};

export const emitCloseRoom = (socket: Socket, payload: RoomPlayerPayload) => {
  socket.emit('close_room', payload);
};

export const emitRequestSecretCharacter = (
  socket: Socket,
  payload: RoomPlayerPayload,
) => {
  socket.emit('request_secret_character', payload);
};

export const emitRequestAllCharacters = (
  socket: Socket,
  payload: RoomPlayerPayload,
) => {
  socket.emit('get_all_characters', payload);
};

export const emitRequestGameData = (socket: Socket, payload: RoomPlayerPayload) => {
  emitRequestSecretCharacter(socket, payload);
  emitRequestAllCharacters(socket, payload);
};
