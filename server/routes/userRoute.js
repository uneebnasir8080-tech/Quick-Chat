
import {Router} from 'express'
import { checkaAuth, login, signUp, updateProfile } from '../controllers/userController.js'
import { protectRoute } from '../middleware/auth.js'


const route= Router()

route.post('/signup', signUp)
route.post('/login', login)
route.put('/update-profile',protectRoute,updateProfile)
route.get('/check',protectRoute,checkaAuth)

export default route


