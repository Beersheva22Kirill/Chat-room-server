import Jwt from 'jsonwebtoken';
import config from 'config';
import { BEARER, ENV_JWT_SECRET } from '../constant/constants.mjs';

const auth = (req,res,next) => {

    const authHeader = req.header('Authorization');
    if(authHeader && authHeader.startsWith(BEARER)){
        const accessToken = authHeader.substring(BEARER.length);
        try {
            const payload = Jwt.verify(accessToken,process.env[config.get(ENV_JWT_SECRET)]);
            req.user = {username: payload.sub, roles:payload.roles};
        } catch (error) {
            
        }
    }
    next()
}

export default auth;