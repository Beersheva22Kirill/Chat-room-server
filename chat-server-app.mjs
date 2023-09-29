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
import { authentificationService, chatRoomService, senderSocketService } from "./src/shared/services.mjs";

const SERVER_PORT = 'server.port';
const port = process.env.PORT || config.get(SERVER_PORT)

const app = express();
const expressWsInstant = expressWs(app);
app.use(bodyParser.json());
app.use(cors())
app.use(auth);

app.use('/chatroom/accounts',accounts);
app.use('/chats',chats)
app.get('/contacts',(req,res) => {
    res.send(chatRoomService.getClients())
});

app.get('/allusers',authVerification('ADMIN','USER'),asyncHandler(
    async (req,res) => {
        const users = await authentificationService.getAllUsers();
        res.send(users)
    }
));



app.ws('/chatroom/websocket', (ws,req) => {
    const clientName = authentificationService.verificationToken(ws.protocol);
    if(!clientName){
        ws.send(getMessageObj(SERVER,getMessageObj(SERVER,AUTHENTIFICATION_ERROR)))
        closeConnection(ws);
    } else {
        processConnection(clientName, ws);
    }
})

//for
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
    chatRoomService.addConnection(clientName, connectionId, ws);
    await authentificationService.setActive(clientName,true)

    senderSocketService.processMessage(SERVER,getMessageObj(SERVER,CHANGES_CLIENTS))
    

    ws.on('close', () => {
        chatRoomService.removeConnection(connectionId);
        authentificationService.setActive(clientName,false)
        senderSocketService.processMessage(SERVER,getMessageObj(SERVER,CHANGES_CLIENTS))
        
    });
    
    ws.on('message', (message) => {
        senderSocketService.processMessage(clientName,message)
        chatRoomService.saveMessage(message)
    })
    
}

function getMessageObj(client_from,message){
    return JSON.stringify({
        from:client_from,
        textMessage:message
    })
}




