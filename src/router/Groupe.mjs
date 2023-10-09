import express from 'express'
import asyncHandler from 'express-async-handler';
import { validation } from '../validation/validation.mjs';
import { groupeSchema } from '../validation/GroupeSchema.mjs';
import valid from '../middleware/valid.mjs';
import { chatRoomService, senderSocketService } from '../shared/services.mjs';
import { CHANGES_CHATS, SERVER } from '../constant/constants.mjs';

export const groupe = express.Router();

groupe.use(validation(groupeSchema))

groupe.post('/create-groupe', valid, asyncHandler(
    async(req,res) => {
        const newGroupe = req.body;
            const groupeResponse = await chatRoomService.createGroupe(newGroupe)
            senderSocketService.processMessage(newGroupe.author,getMessageObj(SERVER,CHANGES_CHATS,newGroupe.users))
    }
))

function getMessageObj(clientFrom,type,clentsTo){
    const message = {
        from:clientFrom,
        type:type,
        textMessage:''
    }

    if(clentsTo){
        message.to = clentsTo
    }

    return JSON.stringify(message)
}