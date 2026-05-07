import mongoose from 'mongoose'

const messageModel= mongoose.Schema({
    senderId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    receiverId:{
        type:mongoose.Schema.Types.ObjectId,
        ref:"User",
        required:true
    },
    text:{
        type:String,
    },
    image:{
        type:String,
    },
    seen:{
        type:Boolean
    }
},{ timestamps: true})

const Message= mongoose.model("Message", messageModel)

export default Message