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

const SERVER_PORT = 'server.port';
const port = process.env.PORT || config.get(SERVER_PORT)

const app = express();
const expressWsInstant = expressWs(app);
app.use(bodyParser.json());
app.use(cors())

const chatRoom = new ChatRoom();
const authService = new AuthService();

app.use('/chatroom/accounts',accounts);

app.get('/contacts',(req,res) => {
    res.send(chatRoom.getClients())
});

app.get('/allusers',asyncHandler(
    async (req,res) => {
        const users = await authService.getAllUsers();
        res.send(users)
    }
));

app.ws('/contacts/websocket', (ws,req) => {
    const clientName = authService.verificationToken(ws.protocol)  //|| req.query.clientname;
    if(!clientName){
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
    ws.send(`Accsess dinied`);
    ws.close();
}

function processConnection(clientName, ws) {
    const connectionId = crypto.randomUUID();
    chatRoom.addConnection(clientName, connectionId, ws);
    authService.setActive(clientName,true)
    ws.send(`Hello ${clientName}`);

    ws.on('close', () => {
        chatRoom.removeConnection(connectionId);
        authService.setActive(clientName,false)
        
    });

    ws.on('message', processMessage.bind(undefined,clientName,ws))
}

function processMessage(clientName,ws,message){
    try {
        const messageObj = JSON.parse(message.toString());
        const clients = messageObj.to;
        const textMessage = messageObj.text;
        
            if(!textMessage || textMessage === ''){
                ws.send(`Message must have field text and text message`) 
            }

        const sockets = getClientsForSending(clients);
        const messageForSend = getMessageForSend(clientName,textMessage)
        sendMessage(sockets,ws,messageForSend)
    
    } catch (error) {
        ws.send(`Wrong format of message`) 
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
        text:textMessage
    }
    return message;
}

function sendMessage(sockets,ws,messageForSend){
    if(sockets.length === 0) {
        ws.send(`clients not found`)
    }else {
        sockets.forEach(socket => {
            socket.send(JSON.stringify(messageForSend));
        })
    } 
}



