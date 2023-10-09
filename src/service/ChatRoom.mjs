import config from 'config'
import crypto from 'node:crypto'
import { CHAT, CHAT_NOT_FOUND, MONGO_DB_NAME, MONGO_ENV_URI_CHAT } from '../constant/constants.mjs';
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

    async createChat(newChat){
        const query = { $and : [ { type : CHAT }, { users : { $all : [ { username : newChat.users[0], active : false }, { username : newChat.users[1], active : true } ] } } ] }
        const oldChat = await this.#collectionChats.findOne(query);
        this.#collectionChats.aggregate()
        let chatId;
        if(!oldChat){
            chatId = crypto.randomUUID();
            const chat = createChatObjectDB(newChat,chatId);
                await this.#collectionChats.insertOne(chat);
        } else {
                chatId = oldChat._id;
                await this.setActiveUser(oldChat._id, newChat.users[0], true);
        }
        
        return chatId;
    }

    async createGroupe(newGroupe){
       
            const groupeId = crypto.randomUUID();
            const groupe = createChatObjectDB(newGroupe,groupeId);
                await this.#collectionChats.insertOne(groupe);
        
        return groupeId;
    }

    async removeChat(user,chatId){
        const chat = await this.#collectionChats.findOne({_id:chatId});
        if(chat){
            this.setActiveUser(chat._id,user,false)
        }
        return chat._id
    }

    async setActiveUser(chatId, user, active) {
                
        await this.#collectionChats.updateOne({ _id: chatId,"users.username":user}, { $set: { "users.$.active": active } });
    
    }

    async getAllChats(){
        const chats = await this.#collectionChats.find().toArray();
        return chats
    }

    async getChats(username){
        //const query = { $and : [ { type : CHAT }, { users : { username : username, active : true } } ] }
        const query = { users : { username : username, active : true } }
        const chats = await this.#collectionChats.find(query).toArray()
        const arrChatItem = chats.map(chat => {
            let name;
            if (chat.type == 'GROUPE') {
                name = chat.groupeName
            }  else {
                name = chat.users[0].username != username ? chat.users[0].username : chat.users[1].username 
            }
            const chatItem = {
                idChat:chat._id,
                chatName: name,
                users:chat.users,
                type:chat.type
                
                
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

    async isActive(chatId,user){
        const chat = await this.getChat(chatId);
        const index = chat.users.findIndex((u) => u.username === user);
        let result = true;
        if (index > -1 && !chat.users[index].active){
            result = false
        }
        return result;
    }

    async saveMessage(message){
            const chat = await this.#collectionChats.findOne({_id:message.chatId});
            if (chat) {
                chat.messages.push(message);
                await this.#collectionChats.updateOne({_id:message.chatId},{$set:{messages:chat.messages}})
            } 
             
       return chat ? chat.messages.length : null 
    }

    async getChat(chatId){
        const chat = await this.#collectionChats.findOne({_id:chatId})
        if (!chat) {
            chat = CHAT_NOT_FOUND
        }
        return toChat(chat)

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

function createChatObjectDB(chat,chatId){
const chatObject = {
    _id:chatId,
    type:chat.type,
    users:getUsers(chat.users),
    messages:[]
}
    if (chat.type == "GROUPE") {
        setGroupeField(chatObject, chat);
    }

    return chatObject
}

function toChat(chat){

    const chatObject = {
    idChat:chat._id,
    type:chat.type,
    users:chat.users,
    messages:chat.messages
    }

    if (chat.type == "GROUPE") {
        setGroupeField(chatObject, chat);
    }

    return chatObject
}

function setGroupeField(chatObject, chat) {
    chatObject.author = chat.author;
    chatObject.groupeName = chat.groupName;
}

function getUsers(users){
    return users.map(user => {
        return {
            username:user,
            active:true
        }
    })
}