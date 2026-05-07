import jwt from "jsonwebtoken"
import User from "../models/User.js"




export const protectRoute= async(req,res,next)=>{
    try {
        const token = req.headers.token
        
        const decoded= jwt.verify(token, process.env.SECRET)


        const user= await User.findById(decoded).select("-password")

        if(!user){
            return res.json({status:false, message:"User not found"})
        }
        req.user= user

        next()
    } catch (error) {
         console.log(error.message)
        return res.json({status:false, message:error.message})
    }
}