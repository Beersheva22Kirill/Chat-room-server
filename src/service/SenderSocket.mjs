import { CLIENT_NOT_FOUND, SERVER, TEXT_FIELD_NOT_FOUND, WRONG_MESSAGE } from "../constant/constants.mjs";


export default class SenderSocket {

    #chatRoom;
    
    constructor(chatRoom){
        this.#chatRoom = chatRoom;
    }

    processMessage(clientName,message){
        const ws = this.#chatRoom.getClientWebSockets(clientName);
        try {
            const messageObj = JSON.parse(message.toString());
            const clients = messageObj.to;
            const textMessage = messageObj.textMessage;
            
                if(!textMessage || textMessage === ''){
                    ws.forEach(socket => {
                        const errorMessage = JSON.stringify(this.#getMessageForSend(SERVER,TEXT_FIELD_NOT_FOUND)) 
                        socket.send(errorMessage)
                    })    
                }
    
            const sockets = this.#getClientsForSending(clients);
            const messageForSend = this.#getMessageForSend(clientName,textMessage)
            this.#sendMessage(sockets,ws,messageForSend)
        
        } catch (error) {
            ws.forEach(socket => {
                const errorMessage = JSON.stringify(this.#getMessageForSend(SERVER,WRONG_MESSAGE)) 
                socket.send(errorMessage)
            }) 
        }
    }

    #getClientsForSending(clients) {
        let sockets = [];
        if (!clients || clients == 'all') {
            sockets = this.#chatRoom.getAllWebSockets();
        } else {
            clients.forEach(client => {
                const socketsOfClient = this.#chatRoom.getClientWebSockets(client);
                socketsOfClient.forEach(socket => {
                    sockets.push(socket);
                });
            });
        }
        return sockets;
    }
    #getMessageForSend(clientName,textMessage){
        const message = {
             from:clientName,
             textMessage:textMessage
         }
         return message;
     }

     #sendMessage(sockets,ws,messageForSend){
        if(sockets.length === 0) {
            ws.forEach(socket => {
                const error = JSON.stringify(this.#getMessageForSend(SERVER,CLIENT_NOT_FOUND))
                socket.send(error)
            })
        }else {
            sockets.forEach(socket => {
                socket.send(JSON.stringify(messageForSend));
            })
        } 
    }

}

