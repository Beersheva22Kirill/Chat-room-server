
export const valid = (req,res,next) => {

    if (!req.body) { 
        throw 'Not body exists'
    } 

    if (!req.validated) {
        throw 'Must be validated'
    }

    if(!req.joiError){
        res.status(400);
        throw req.joiError;
    }

    res.status(200);
    next();
}

export default valid;
