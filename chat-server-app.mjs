import express  from "express";
import crypto from 'node:crypto'
import expressWs from "express-ws";
import ChatRoom from "./src/service/ChatRoom.mjs";
import config from 'config';
import { Socket } from "node:dgram";

const SERVER_PORT = 'server.port';
const port = process.env.PORT || config.get(SERVER_PORT)

const app = express();
const expressWsInstant = expressWs(app);

const chatRoom = new ChatRoom();

app.get('/contacts',(req,res) => {
    res.send(chatRoom.getClients())
});

app.ws('/contacts/websocket', (ws,req) => {
    const clientName = ws.protocol || req.query.clientname;
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
    ws.send(`Hello ${clientName}`);

    ws.on('close', () => {
        chatRoom.removeConnection(connectionId);
    });

    ws.on('message', processMessage.bind(undefined,clientName,ws))
}

function processMessage(clientName,ws,message){
    try {
        const messageObj = JSON.parse(message.toString());
        const clients = messageObj.to;
        
        if(!messageObj.text){
            ws.send(`Message must have field text`) 
        }
        let sockets = [];
        if(!clients || clients == 'all'){
            sockets = chatRoom.getAllWebSockets();   
        } else {
            clients.forEach(client => {
                const socketsOfClient = chatRoom.getClientWebSockets(client);
                socketsOfClient.forEach(socket => {
                sockets.push(socket);
                })
            })
        }
        const messageForSend = {
            from:clientName,
            text:messageObj.text
        }

        sendMessage(sockets,ws,messageForSend)
    
    } catch (error) {
        ws.send(`Message must have JSON`) 
    }
  
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



