import express from 'express'
import asyncHandler from 'express-async-handler'
import { chatSchema } from '../validation/ChatSchema.mjs';
import valid from '../middleware/valid.mjs';
import { validation } from '../validation/validation.mjs';
import ChatRoom from '../service/ChatRoom.mjs';
import authVerification from '../middleware/authVerification.mjs';
import { CHANGES_CHATS, SERVER } from '../constant/constants.mjs';
import { removeChatSchema } from '../validation/RemoveChatSchema.mjs';

export const chats = express.Router();

const chatRoom = new ChatRoom()

chats.use(validation(chatSchema))
chats.post('/create-chat',valid, asyncHandler(
        async (req,res) =>{
            const newChat = req.body;
            const chatResponse = await chatRoom.createChat(newChat.user_from,newChat.user_to)
            res.send(getMessageObj(SERVER,CHANGES_CHATS));
    })
)
chats.use(validation(removeChatSchema))
chats.post('/remove-chat',valid, asyncHandler(
    async (req,res) =>{
        const chatObject = req.body;
        const chatResponse = await chatRoom.removeChat(chatObject.user,chatObject.chatId);
        res.send(getMessageObj(SERVER,CHANGES_CHATS));
})
)

chats.get('',authVerification("ADMIN"),asyncHandler(
    async (req,res) => {
        res.send(await chatRoom.getAllChats())
    }
))

chats.get('/mychats',authVerification('ADMIN','USER'),asyncHandler(
    async (req,res) => {
        const username = req.user.username;
        const chats = await chatRoom.getChats(username);
        res.send(chats);
    }
))

function getMessageObj(client_from,message){
    return JSON.stringify({
        from:client_from,
        textMessage:message
    })
}