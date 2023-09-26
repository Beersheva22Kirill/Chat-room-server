import config from 'config'
import { MONGO_DB_NAME, MONGO_ENV_URI_CHAT } from '../constant/constants.mjs';
import MongoConnection from '../mongo/MongoConnection.mjs';

export default class ChatRoom {

    #clients; //{<clientName>:{connections:[<array of connections ids>],chats:[<array of chats ids>]}}
    #connections; // {<connectionId>: {client: <clientName>, socket: <websocket>}}
    #collectionChats;

    constructor(){
        this.#clients = {};
        this.#connections = {};
        const connection_string = process.env[config.get(MONGO_ENV_URI_CHAT)];
        const dbName = config.get(MONGO_DB_NAME);
        const connectionDB = new MongoConnection(connection_string,dbName);
        this.#collectionChats = connectionDB.getCollection('chats')

    }

    addConnection(clientName, connectionId, ws){
        this.#connections[connectionId] = {client: clientName, socket:ws};
        if(this.#clients[clientName]){
            this.#clients[clientName].connections.push(connectionId);
        } else {
            this.#clients[clientName] = [connectionId];
        }  
        return connectionId;
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