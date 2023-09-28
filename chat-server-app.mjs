import express  from "express";
import crypto from 'node:crypto'
import expressWs from "express-ws";
import ChatRoom from "./src/service/ChatRoom.mjs";
import config from 'config';
import { Socket } from "node:dgram";
import { accounts } from "./src/router/Accounts.mjs";
import bodyParser from 'body-parser';
import errorHandler from "./src/middleware/errorHandler.mjs";
import cors from 'cors'
import asyncHandler from 'express-async-handler'
import AuthService from "./src/service/AuthService.mjs";
import authVerification from "./src/middleware/authVerification.mjs";
import { chats } from "./src/router/Chats.mjs";
import auth from "./src/middleware/auth.mjs";
import { ACCESS_DENIED, AUTHENTIFICATION_ERROR, CHANGES_CLIENTS, CLIENT_NOT_FOUND, SERVER, TEXT_FIELD_NOT_FOUND, WRONG_MESSAGE } from "./src/constant/constants.mjs";

const SERVER_PORT = 'server.port';
const port = process.env.PORT || config.get(SERVER_PORT)

const app = express();
const expressWsInstant = expressWs(app);
app.use(bodyParser.json());
app.use(cors())
app.use(auth);

const chatRoom = new ChatRoom();
const authService = new AuthService();

app.use('/chatroom/accounts',accounts);
app.use('/chats',chats)
app.get('/contacts',(req,res) => {
    res.send(chatRoom.getClients())
});

app.get('/allusers',authVerification('ADMIN','USER'),asyncHandler(
    async (req,res) => {
        const users = await authService.getAllUsers();
        res.send(users)
    }
));



app.ws('/chatroom/websocket', (ws,req) => {
    const clientName = authService.verificationToken(ws.protocol);
    if(!clientName){
        ws.send(getMessageObj(SERVER,AUTHENTIFICATION_ERROR))
        closeConnection(ws);
    } else {
        processConnection(clientName, ws);
    }
})

app.ws('/contacts/websocket/:clientName', (ws,req) => {
    const clientName = req.params.clientName;
    processConnection(clientName, ws);
    
})

const server = app.listen(port);
app.use(errorHandler);
server.on('listening',() => {
    console.log(`Server listening on port: ${server.address().port}`);
})

function closeConnection(ws) {
    ws.close();
}

async function processConnection(clientName, ws) {
    const connectionId = crypto.randomUUID();
    chatRoom.addConnection(clientName, connectionId, ws);
    await authService.setActive(clientName,true)

    processMessage(SERVER,ws,getMessageObj(SERVER,CHANGES_CLIENTS))

    ws.on('close', () => {
        chatRoom.removeConnection(connectionId);
        authService.setActive(clientName,false)
        processMessage(SERVER,ws,getMessageObj(SERVER,CHANGES_CLIENTS))
    });

    ws.on('message', processMessage.bind(undefined,clientName,ws))
}

function processMessage(clientName,ws,message){
    try {
        const messageObj = JSON.parse(message.toString());
        const clients = messageObj.to;
        const textMessage = messageObj.textMessage;
        
            if(!textMessage || textMessage === ''){
                ws.send(TEXT_FIELD_NOT_FOUND) 
            }

        const sockets = getClientsForSending(clients);
        const messageForSend = getMessageForSend(clientName,textMessage)
        sendMessage(sockets,ws,messageForSend)
    
    } catch (error) {
        ws.send(WRONG_MESSAGE) 
    }
}

function getClientsForSending(clients) {
    let sockets = [];
    if (!clients || clients == 'all') {
        sockets = chatRoom.getAllWebSockets();
    } else {
        clients.forEach(client => {
            const socketsOfClient = chatRoom.getClientWebSockets(client);
            socketsOfClient.forEach(socket => {
                sockets.push(socket);
            });
        });
    }
    return sockets;
}

function getMessageForSend(clientName,textMessage){
   const message = {
        from:clientName,
        textMessage:textMessage
    }
    return message;
}

function getMessageObj(client_from,message){
    return JSON.stringify({
        from:client_from,
        textMessage:message
    })
}

function sendMessage(sockets,ws,messageForSend){
    if(sockets.length === 0) {
        ws.send(CLIENT_NOT_FOUND)
    }else {
        sockets.forEach(socket => {
            socket.send(JSON.stringify(messageForSend));
        })
    } 
}



