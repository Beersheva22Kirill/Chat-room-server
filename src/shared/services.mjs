import AuthService from "../service/AuthService.mjs";
import ChatRoom from "../service/ChatRoom.mjs";
import SenderSocket from "../service/SenderSocket.mjs";

export const chatRoomService = new ChatRoom();
export const authentificationService = new AuthService();
export const senderSocketService = new SenderSocket(chatRoomService)