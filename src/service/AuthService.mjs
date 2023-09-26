import bcrypt from "bcrypt"
import config from 'config';
import Jwt  from "jsonwebtoken";
import { ENV_JWT_SECRET, MONGO_DB_NAME, MONGO_ENV_URI_CHAT } from '../constant/constants.mjs';
import MongoConnection from '../mongo/MongoConnection.mjs';


export default class AuthService {
    #collection;
   

    constructor(){

        const connection_string = process.env[config.get(MONGO_ENV_URI_CHAT)];
        const dbName = config.get(MONGO_DB_NAME)
        const connection = new MongoConnection(connection_string,dbName);
        this.#collection = connection.getCollection('accounts');        
    }


    async login(loginData){
        const account = await this.getAccount(loginData.username);
        let accessToken;
        if (account && await bcrypt.compare(loginData.password, account.passwordHash)) {
            accessToken = getJWTToken(account.username,account.roles);
        }
        return accessToken;
    }

    async setActive(username,activeValue){
       
        return await this.#collection.updateOne({_id:username},{$set:{active:activeValue}})
    }

     async signUp(account){
        const accountDb = await toAccountDb(account);
        try {
            await this.#collection.insertOne(accountDb);
        } catch (error) {
            if (error.code == 11000) {
                account = null;
            } else {
                throw error;
            }
        }
        return account;
        
    }

    async getAccount(username){
        const document = await this.#collection.findOne({_id:username});
        return document == null ? null : toAccount(document);
    }

    async getAllUsers() {
            const documents = await this.#collection.find().toArray();
            const users = documents.map(doc => toUser(doc));
        return users
    }

    verificationToken(token){
        let userData;
        try {
            userData = Jwt.verify(token,process.env[config.get(ENV_JWT_SECRET)]);
       } catch (error) {
            console.log(error.message);
       } finally{
            return userData ? userData.sub : undefined
       }
        
        
    }
}


function toAccount(accountDb){
    const result = {username:accountDb._id,
        roles:accountDb.roles,
        passwordHash:accountDb.passwordHash,
        active:accountDb.active,
        blocked:accountDb.blocked};
    delete result._id;
    return result;
}

function toUser(accountDb){
    const result = {username:accountDb._id,
        active:accountDb.active,
        blocked:accountDb.blocked};
    delete result._id;
    return result;
}

async function toAccountDb(account) {
   const passHash = await bcrypt.hash(account.password,10); 
    const result = {_id:account.username,
        passwordHash:passHash,
        roles:account.roles,
        active:account.active ? account.active : false,
        blocked:account.blocked ? account.blocked : false};     
    return result;
}

function getJWTToken(username, roles) {
    return Jwt.sign({roles},process.env[config.get(ENV_JWT_SECRET)],{
        expiresIn:config.get("jwt.expiresIn"),
        subject:username
    })
}
