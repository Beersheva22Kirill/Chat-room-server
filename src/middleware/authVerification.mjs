import { ACCESS_DENIED, AUTHENTIFICATION_ERROR } from "../constant/constants.mjs";

const authVerification = (...roles) => {
    return (req,res,next) => {
        if(!req.user){
            res.status(401);
            throw AUTHENTIFICATION_ERROR;
        }
        const userRoles = req.user.roles;
        if(!userRoles.some(ur => roles.includes(ur))){
            res.status(403);
            throw ACCESS_DENIED;
        }
        next();
    }
}

export default authVerification;
   
