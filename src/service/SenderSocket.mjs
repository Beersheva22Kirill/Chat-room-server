import { CLIENT_NOT_FOUND, ERROR_TYPE, SERVER, TEXT_FIELD_NOT_FOUND, TYPE_FIELD_NOT_FOUND, WRONG_MESSAGE } from "../constant/constants.mjs";


export default class SenderSocket {

    #chatRoom;
    
    constructor(chatRoom){
        this.#chatRoom = chatRoom;
    }

    processMessage(clientNameFrom,message){
        const senderWs = this.#chatRoom.getClientWebSockets(clientNameFrom);
        try {
            const messageObj = JSON.parse(message.toString());
            const chatId = messageObj.chatId;
            const dateMessage = messageObj.date;
            const clients = messageObj.to;
            const type = messageObj.type;
            const textMessage = messageObj.textMessage;
            
                if(!textMessage || textMessage === ''){
                    senderWs.forEach(socket => {
                        const errorMessage = JSON.stringify(this.#getMessageForSend(undefined,SERVER,ERROR_TYPE,TEXT_FIELD_NOT_FOUND)) 
                        socket.send(errorMessage)
                    })    
                }

                if(!type){
                    senderWs.forEach(socket => {
                        const errorMessage = JSON.stringify(this.#getMessageForSend(undefined,SERVER,ERROR_TYPE,TYPE_FIELD_NOT_FOUND)) 
                        socket.send(errorMessage)
                    }) 
                }
    
            const sockets = this.#getClientsForSending(clients);
            const messageForSend = this.#getMessageForSend(chatId,clientNameFrom,type,textMessage,dateMessage)
            this.#sendMessage(sockets,senderWs,messageForSend)
        
        } catch (error) {
            senderWs.forEach(socket => {
                const errorMessage = JSON.stringify(this.#getMessageForSend(undefined,SERVER,ERROR_TYPE,WRONG_MESSAGE)) 
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
    #getMessageForSend(chatId,clientName,type,textMessage,dateMessage){
        const message = {
             chatId:chatId,
             type:type,
             delivered:false,
             read:false,
             from:clientName,
             textMessage:textMessage
         }
         message.date = dateMessage ? dateMessage : new Date().toString()
         return message;
     }

     #sendMessage(sockets,ws,messageForSend){
       
        // ws.forEach(socket => {
        //     socket.send(JSON.stringify(messageForSend));
        // })

        if(sockets.length != 0) {
            sockets.forEach(socket => {
                socket.send(JSON.stringify(messageForSend));
            })
        }
    }

}

