import jwt from 'jsonwebtoken'

export const createToken= (userId)=>{

        const id= userId.toString()
        const token= jwt.sign(id, process.env.SECRET)
    
        
    
    return token
}