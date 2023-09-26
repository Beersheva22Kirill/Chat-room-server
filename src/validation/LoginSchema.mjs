import Joi from "joi";

export const loginShema = Joi.object({
    username:Joi.string().alphanum().required(),
    password:Joi.string().alphanum().required()
})