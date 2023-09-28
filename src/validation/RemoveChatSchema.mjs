import Joi from "joi";


export const removeChatSchema = Joi.object({
    user:Joi.string().alphanum().required(),
    chatId:Joi.string().alphanum().required()
})