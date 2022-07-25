import { Router, Application } from 'express'
import { auth } from '@/middlewares/AuthMiddleware'
import p from '@/config/permissions'
import * as roleC from '@/controllers/admin/roles.controller'
import * as userC from '@/controllers/admin/users.controller'
import * as pricesC from '@/controllers/admin/prices.controller'
import * as ordersC from '@/controllers/admin/orders.controller'
import * as categoriesC from '@/controllers/admin/categories.controller'
import * as lessonsC from '@/controllers/admin/lessons.controller'
import * as episodesC from '@/controllers/admin/episodes.controller'

export const route = Router()

route.get('/permissions', auth(), roleC.getPermissions)
route.get('/roles', auth(), roleC.getRoles)
route.get('/roles/:id', auth(), roleC.getRole)
route.post('/roles', auth({ can: p.MANAGE_ROLE }), roleC.createRole)
route.put('/roles/:id', auth({ can: p.MANAGE_ROLE }), roleC.updateRole)
route.delete('/roles/:id', auth({ can: p.MANAGE_ROLE }), roleC.deleteRole)

route.get('/users', auth({ can: p.MANAGE_USER }), userC.getUsers)
route.get('/users/:id', auth({ can: p.MANAGE_USER }), userC.getUser)
route.post('/users', auth({ can: p.MANAGE_USER }), userC.createUser)
route.put('/users/:id', auth({ can: p.MANAGE_USER }), userC.updateUser)
route.put('/users/:id/avatar', auth({ can: p.MANAGE_USER }), userC.updateAvatar)
route.delete('/users/:id', auth({ can: p.MANAGE_USER }), userC.deleteUser)

route.get('/prices', auth({ can: p.MANAGE_PRICE }), pricesC.getPrices)
route.get('/prices/:id', auth({ can: p.MANAGE_PRICE }), pricesC.getPrice)
route.put('/prices/:id', auth({ can: p.MANAGE_PRICE }), pricesC.updatePrice)

route.get('/orders', auth({ can: p.MANAGE_ORDER }), ordersC.getOrders)
route.get('/orders/:id', auth({ can: p.MANAGE_ORDER }), ordersC.getOrder)
route.get('/orders/user/:userId', auth({ can: p.MANAGE_ORDER }), ordersC.getUserOrders)
route.put('/orders/:id/cancel', auth({ can: p.MANAGE_ORDER }), ordersC.cancelOrder)
route.delete('/orders/:id', auth({ can: p.MANAGE_ORDER }), ordersC.deleteOrder)

route.get('/categories', auth(), categoriesC.getCategories)
route.get('/categories/:id', auth(), categoriesC.getCategory)
route.post('/categories', auth({ can: p.MANAGE_CATEGORY }), categoriesC.createCategory)
route.put('/categories/:id', auth({ can: p.MANAGE_CATEGORY }), categoriesC.updateCategory)
route.delete('/categories/:id', auth({ can: p.MANAGE_CATEGORY }), categoriesC.deleteCategory)

route.get('/lessons', auth({ can: p.MANAGE_LESSON }), lessonsC.getLessons)
route.get('/lessons/:id', auth({ can: p.MANAGE_LESSON }), lessonsC.getLesson)
route.post('/lessons', auth({ can: p.MANAGE_LESSON }), lessonsC.createLesson)
route.put('/lessons/:id', auth({ can: p.MANAGE_LESSON }), lessonsC.updateLesson)
route.delete('/lessons/:id', auth({ can: p.MANAGE_LESSON }), lessonsC.deletelesson)

route.post('/episodes/:lessonId', auth({ can: p.MANAGE_LESSON }), episodesC.createEpisode)
route.put('/episodes/:lessonId/index', auth({ can: p.MANAGE_LESSON }), episodesC.updateEpisodeIndex)
route.get('/episodes/:episodeId/url', auth({ can: p.MANAGE_LESSON }), episodesC.getEpisodeUrl)
route.put('/episodes/:lessonId/:episodeId', auth({ can: p.MANAGE_LESSON }), episodesC.updateEpisode)
route.delete('/episodes/:lessonId/:episodeId', auth({ can: p.MANAGE_LESSON }), episodesC.deleteEpisode)

export default function initAdminRoutes(app: Application) {
  app.use('/admin', route)
}
