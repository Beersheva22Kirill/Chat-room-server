import Joi from "joi";


export const chatSchema = Joi.object({
    user_from:Joi.string().alphanum().required(),
    user_to:Joi.string().alphanum().required()
})