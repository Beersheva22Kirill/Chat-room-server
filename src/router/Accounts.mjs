
import express from 'express'
import { validation } from "../validation/validation.mjs";
import { accountSchema } from "../validation/AccountSchema.mjs";
import valid from "../middleware/valid.mjs";
import AuthService from '../service/AuthService.mjs';
import asyncHandler from 'express-async-handler'
import authVerification from '../middleware/authVerification.mjs';
import { loginShema } from '../validation/LoginSchema.mjs';

export const accounts = express.Router();

const service = new AuthService();

accounts.use(validation(accountSchema))
accounts.post('/signup',valid,asyncHandler(
        async (req,res) => {
        const user = await service.signUp(req.body);
        res.status(201).send(user);
    }
))

accounts.use(validation(loginShema));
accounts.post('/login',valid,asyncHandler(
    async (req,res) => {
        const token = await service.login(req.body);
        const sendObj = {
            accessToken:token
        }
        res.status(201).send(JSON.stringify(sendObj));
    }
))