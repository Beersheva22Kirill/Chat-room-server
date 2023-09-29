import config from 'config'
import crypto from 'node:crypto'
import { MONGO_DB_NAME, MONGO_ENV_URI_CHAT } from '../constant/constants.mjs';
import MongoConnection from '../mongo/MongoConnection.mjs';

export default class ChatRoom {

    #clients; //{<clientName>:[<array of connections ids>]}}
    #connections; // {<connectionId>: {client: <clientName>, socket: <websocket>}}
    #collectionChats;
    #collectionUsers;

    constructor(){
        this.#clients = {};
        this.#connections = {};
        const connection_string = process.env[config.get(MONGO_ENV_URI_CHAT)];
        const dbName = config.get(MONGO_DB_NAME);
        const connectionDB = new MongoConnection(connection_string,dbName);
        this.#collectionChats = connectionDB.getCollection('chats')
        this.#collectionUsers = connectionDB.getCollection('accounts');
    }

    addConnection(clientName, connectionId, ws){
        this.#connections[connectionId] = {client: clientName, socket:ws};
        if(this.#clients[clientName]){
            this.#clients[clientName].push(connectionId);
        } else {
            this.#clients[clientName] = [connectionId];
        }  
        return connectionId;
    }

    async createChat(user_from,user_to){
        const query = {$and: [ { $or: [ { "user_from.username": user_from }, { "user_to.username": user_from } ] }, { $or: [ { "user_from.username": user_to }, { "user_to.username": user_to } ] } ] }
        const oldChat = await this.#collectionChats.findOne(query);
        let chatId;
        if(!oldChat){
            chatId = crypto.randomUUID();
            const chat = toChatDB(user_from,user_to,chatId);
                await this.#collectionChats.insertOne(chat);
                await this.addChatForUser(user_from,user_to);
                await this.addChatForUser(user_to,user_from);
        } else {
                chatId = oldChat._id;
                await this.setActiveUser(oldChat, user_from, true);
        }
        
        return chatId;
    }

    async removeChat(user,chatId){
        const chat = await this.#collectionChats.findOne({_id:chatId});
        if(chat){
            this.setActiveUser(chat,user,false)
        }
        return chat._id
    }

    async setActiveUser(chat, user, active) {
        if (chat.user_from.username === user) {
            await this.#collectionChats.updateOne({ _id: chat._id }, { $set: { "user_from.active": active } });
        } else {
            await this.#collectionChats.updateOne({ _id: chat._id }, { $set: { "user_to.active": active } });
        }
    }

    async getAllChats(){
        const chats = await this.#collectionChats.find().toArray();
        return chats
    }

    async getChats(username){
        const query = {$or: [ { $and: [ { "user_from.username": username },{ "user_from.active": true }] }, { $and: [ { "user_to.username": username }, { "user_to.active": true } ] } ]}
        const chats = await this.#collectionChats.find(query).toArray()
        const arrChatItem = chats.map(chat => {
            const chatItem = {
                idChat:chat._id,
                chatName:chat.user_from.username === username ? chat.user_to.username : chat.user_from.username
            }
            return chatItem;
        })
        return arrChatItem;
    }

    async addChatForUser(user,сompanion){
        const account = await this.#collectionUsers.findOne({_id:user});
        let chatArray = account.chats;
        if (!chatArray) {
            chatArray = [сompanion]
        } else {
            chatArray.push(сompanion);
        }
        await this.#collectionUsers.updateOne({_id:user},{$set:{chats:chatArray}})
       return chatArray; 
    }

    async saveMessage(message){
            const chat = await this.#collectionChats.findOne({_id:message.chatId});
            if (chat) {
                chat.messages.push(message);
                await this.#collectionChats.updateOne({_id:message.chatId},{$set:chat.messages})
            } 
             
       return chat ? chat.messages.length : null 
    }

    removeConnection(connectionId){
            const client = this.#connections[connectionId].client;
            const clientsConnection = this.#clients[client];
            const index = clientsConnection.findIndex(id => connectionId == id);
            
            if (index < 0) {
                throw `illegal state with connection ${connectionId}`   
            }
            
            clientsConnection.splice(index,1);
            
            if(clientsConnection.length == 0) {
                delete this.#clients[client]
            }

            delete this.#connections[connectionId];
        return connectionId
    }

    getClientWebSockets(clientName){
        let res = [];
        if(this.#clients[clientName]){
            res = this.#clients[clientName].map((connectionId => this.#connections[connectionId].socket))
        }
        return res;
    }

    getAllWebSockets(){
        
        return Object.values(this.#connections).map(connection => connection.socket);
    }

    getClients(){
        return Object.keys(this.#clients);
    }

}

function toChatDB(user_from,user_to,chatId){
    return {
        _id:chatId,
        user_from:{username:user_from,active:true},
        user_to:{username:user_to,active:true},
        messages:[]
    }
}