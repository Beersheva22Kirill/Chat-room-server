import Joi from "joi";

export const accountSchema = Joi.object({
    username:Joi.string().min(4).alphanum().required(),
    phone:Joi.number(),
    password:Joi.string().min(6).alphanum().required(),
    roles:Joi.array().valid('ADMIN',"USER").required()
}) 
