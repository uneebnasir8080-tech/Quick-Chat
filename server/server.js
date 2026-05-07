import "dotenv/config"
import express from 'express'
import {createServer} from 'http'
import cors from 'cors'
import { connectDb } from "./lib/db.js"
import route from "./routes/userRoute.js"
import msgRoute from "./routes/messageRoute.js"
import { Server } from "socket.io"

const app= express()
const server= createServer(app)
const PORT = 5000
export const io= new Server(server,{
    cors:{
        origin:"*"
    }
})


export const userSocketMap= {}   // {userId: socketId}

io.on('connection',(socket)=>{
    const userId= socket.handshake.query.userId
    console.log("User Connected", userId)

    if(userId) userSocketMap[userId]=socket.id

    io.emit('getOnlineUser',Object.keys(userSocketMap))

    socket.on('disconnect',()=>{
        console.log("User disconnected",userId)
        delete userSocketMap[userId]
    io.emit('getOnlineUser',Object.keys(userSocketMap))

    })
})



app.use(express.json({limit:'4mb'}))
app.use(cors({
    origin:"*"
}))

app.use('/api/status',(req, res)=>{
    res.send("server is live")
})
app.use('/api/auth',route)
app.use('/api/messages',msgRoute)

await connectDb()

server.listen(PORT,()=>{
    console.log("Server is running on", PORT)
})