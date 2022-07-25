import { Router, Application } from 'express'
import { auth } from '@/middlewares/AuthMiddleware'
import * as authC from '@/controllers/app/auth.controller'
import * as accountC from '@/controllers/app/account.controller'
import * as activitiesC from '@/controllers/app/activities.controller'
import * as pricesC from '@/controllers/app/prices.controller'
import * as ordersC from '@/controllers/app/orders.controller'
import * as commentsC from '@/controllers/app/comments.controller'
import * as episodesC from '@/controllers/app/episodes.controller'

export const route = Router()

route.post('/auth/register', authC.register)
route.post('/auth/login', authC.login)
route.post('/auth/password', authC.forgotPassword)
route.post('/auth/password/verify', authC.verifyResetPasswordCode)
route.put('/auth/password', authC.resetPassword)

route.get('/account/profile', auth(), accountC.getProfile)
route.put('/account/profile', auth(), accountC.updateProfile)
route.put('/account/avatar', auth(), accountC.updateAvatar)
route.post('/account/pusher', auth(), accountC.pusherLogin)

route.get('/activities', auth(), activitiesC.getActivities)
route.post('/activities/:episodeId', auth(), activitiesC.createActivity)

route.get('/prices', pricesC.getPrices)
route.get('/prices/:slug', pricesC.getPrice)

route.get('/orders', auth(), ordersC.getOrders)
route.get('/orders/:id', auth(), ordersC.getOrder)
route.put('/orders/:id/cancel', auth(), ordersC.cancelOrder)
route.post('/orders/checkout/:priceId/:paymentType', auth(), ordersC.checkout)
route.post('/orders/notification/handling', ordersC.notification)

route.get('/comments/:episodeId', commentsC.getComments)
route.post('/comments/:episodeId', auth(), commentsC.createComment)
route.delete('/comments/:commentId', auth(), commentsC.deleteComment)
route.post('/replies/:commentId', auth(), commentsC.createReply)
route.delete('/replies/:replyId', auth(), commentsC.deleteReply)

route.get('/episodes/:episodeId/url', auth({ required: false }), episodesC.getEpisodeUrl)

export default function initAppRoutes(app: Application) {
  app.use(route)
}
