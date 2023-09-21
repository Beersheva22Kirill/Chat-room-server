

export default class ChatRoom {

    #clients; //{<clientName>:[<array of connections ids>]}
    #connections; // {<connectionId>: {client: <clientName>, socket: <websocket>}}

    constructor(){
        this.#clients = {};
        this.#connections = {};
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