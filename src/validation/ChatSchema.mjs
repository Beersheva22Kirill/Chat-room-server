import Joi from "joi";


export const chatSchema = Joi.object({
    users:Joi.array().max(2).valid(Joi.string().alphanum()).required()
    
})