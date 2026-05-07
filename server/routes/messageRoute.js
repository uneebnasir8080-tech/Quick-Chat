import {Router} from 'express'
import { allUser, getMessage, markMessageAsSeen, sendMessage } from '../controllers/messageController.js'
import { protectRoute } from '../middleware/auth.js'

const msgRoute= Router()


msgRoute.get('/users',protectRoute,allUser)
msgRoute.get('/:id',protectRoute,getMessage)
msgRoute.put('/mark/:id',protectRoute,markMessageAsSeen)
msgRoute.post('/send/:id',protectRoute,sendMessage)
export default msgRoute

