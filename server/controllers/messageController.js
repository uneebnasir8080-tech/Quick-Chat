

// get all users except loggedin and get unseen messages

import cloudinary from "../lib/cloudinary.js";
import Message from "../models/Message.js";
import User from "../models/User.js";
import {io, userSocketMap } from "../server.js";

export const allUser= async(req,res)=>{
    try {
        const userId= req.user._id

        const filteredUser= await User.find({_id:{$ne:userId}}).select("-password")

        // count number of messages not seen 
        const unseenMessages={}

        const promises= filteredUser.map(async(user)=>{
            const messgae= await Message.find({senderId:user._id, recieverId:userId, seen:false})
            if(messgae.length>0){
                unseenMessages[user._id]= messgae.length
            }
        })
        await Promise.all(promises)
        return res.json({success:true, user:filteredUser, unseenMessages})
    } catch (error) {
        console.log(error.message);
    return res.json({ success: false, message: error.message });
    }
}

// get all messages 

export const getMessage= async(req,res)=>{
    try {
        const {id:selectedUserId}=req.params;
        const myId= req.user._id

        const message= await Message.find({
            $or:[
                {senderId:myId, receiverId:selectedUserId},
                {senderId:selectedUserId, receiverId:myId},
            ]
        })
        await Message.updateMany({senderId:selectedUserId, recieverId:myId}, {seen:true})
        return res.json({success:true, message})
    } catch (error) {
          console.log(error.message);
    return res.json({ success: false, message: error.message });
    }
}

// mark messages as seen 

export const markMessageAsSeen= async(req, res)=>{
    try {
        const {id}= req.params

        await Message.findByIdAndUpdate(id,{seen:true})
        return res.json({success:true})
    } catch (error) {
         console.log(error.message);
    return res.json({ success: false, message: error.message });
    }
}

// send message

export const sendMessage= async(req,res)=>{
    try {
        const {text, image}=req.body
        const receiverId= req.params.id
        const senderId= req.user._id
        let imageUrl
        if(image){
            const upload =await cloudinary.uploader.upload(image)
            imageUrl= upload.secure_url
        }
        const newMessage= await Message.create({
            senderId,
            receiverId,
            text,
            image:imageUrl
        })


        // emit new message to reciever socket
        const receiverSocketId= userSocketMap[receiverId]
        if(receiverSocketId){
            io.to(receiverSocketId).emit('newMessage', newMessage)
        }
        res.json({success:true, newMessage})
    } catch (error) {
         console.log(error.message);
    return res.json({ success: false, message: error.message });
    }
}