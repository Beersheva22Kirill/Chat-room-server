
const authVerification = (...roles) => {
    return (req,res,next) => {
        if(!req.user){
            res.status(401);
            throw `User not authorized`;
        }
        const userRoles = req.user.roles;
        if(!userRoles.some(ur => roles.includes(ur))){
            res.status(403);
            throw `Access dinied`;
        }
        next();
    }
}

export default authVerification;
   
