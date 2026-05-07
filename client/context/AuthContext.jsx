import { createContext, useEffect, useState } from "react";
import axios from 'axios'
import {toast} from 'react-hot-toast'
import {io} from "socket.io-client"


const backendUrl= import.meta.env.VITE_BACKEND_URL
axios.defaults.baseURL=backendUrl

export const AuthContext= createContext()

export const AuthProvider =({children})=>{

    const [token, setToken]= useState(localStorage.getItem('token'))
    const [authUser, setAuthUser]= useState(null)
    const [onlineUser, setOnlineUser]= useState([])
    const [socket, setSocket]= useState(null)

    // check if the user is authenticated and if so , set the userdata and connect the socket 
    const checkAuth= async()=>{
        try {
            const {data}= await axios.get('/api/auth/check')
            if(data.success){
                setAuthUser(data.user)
                connectSocket(data.user)
            }
        } catch (error) {
            toast.error(error.message)
        }
    }
    // login function to handle user authentication and socket connection 

    const login= async(state, credentials)=>{
        try {
            const {data}= await axios.post(`/api/auth/${state}`,credentials)
            if(data.success){
                setAuthUser(data.userData)
                connectSocket(data.userData)
                axios.defaults.headers.common['token']= data.token
                setToken(data.token)
                localStorage.setItem('token',data.token)

                toast.success(data.message)
            }else{
             toast.error(data.message)

            }

        } catch (error) {
             toast.error(error.message)
        }
    }

    // logout function to handle user logout and socket disconnection 
    const logout=()=>{
        localStorage.removeItem('token')
        setAuthUser(null)
        setOnlineUser([])
        setToken(null)
        axios.defaults.headers.common['token']= null
        toast.success("Logout successfully")
        socket.disconnect()
    }

    // function for update user profile 
    const updateProfile= async(body)=>{
        try {
            const {data}=await axios.put('/api/auth/update-profile',body)
            if(data.success){
                setAuthUser(data.user)
                toast.success("Profile update successfull")
                return
            }
                toast.error(data.message)

        } catch (error) {
            toast.error(error.message)
        }
    }

    // connect socket function to handle socket connection and online user update 
    const connectSocket=(userData)=>{
        if(!userData || socket?.connected) return
        const newSocket= io(backendUrl,{
            query:{
                userId:userData._id
            }
        })
        newSocket.connect()
        setSocket(newSocket)
        newSocket.on('getOnlineUser',(userId)=>{
            setOnlineUser(userId)
        })
    }
    useEffect(()=>{
        if(token){
            axios.defaults.headers.common['token']= token
        }
        checkAuth()
    },[])

    const value={
        axios,
        authUser,
        onlineUser,
        socket,
        login,
        logout,
        updateProfile
    }
    return(
        <AuthContext.Provider value={value}>
            {children}
        </AuthContext.Provider>
    )

}