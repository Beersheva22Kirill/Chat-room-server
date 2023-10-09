import Joi from "joi";


export const groupeSchema = Joi.object({
    groupName:Joi.string().alphanum().required(),
    author:Joi.string().alphanum().required(),
    type:Joi.string().valid("GROUPE").required(),
    users:Joi.array().valid(Joi.string().alphanum()).required() 
})