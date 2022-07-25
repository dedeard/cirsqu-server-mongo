import { Types } from 'mongoose'
import Order from '@/models/order.model'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'

export const getOrders = ca(async (req, res) => {
  const orders = await Order.find().sort({ createdAt: -1 })
  res.json(orders)
})

export const getUserOrders = ca(async (req, res) => {
  const userId = req.params.userId
  const orders = await Order.find({ user: userId }).sort({ createdAt: -1 })
  res.json(orders)
})

export const getOrder = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, 'Order not found!')
  }
  const order = await Order.findById(id)
  if (order) throw new ApiError(404, 'Order not found!')
  res.json(order)
})

export const cancelOrder = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, 'Order not found!')
  }
  let order = await Order.findOne({ id, status: 'pending' })
  if (!order) throw new ApiError(404, 'Order not found!')
  order.status = 'cancel'
  await order.save()
  res.json(order)
})

export const deleteOrder = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, 'Order not found!')
  }
  let order = await Order.findById(id)
  if (!order) throw new ApiError(404, 'Order not found!')
  await order.delete()
  res.sendStatus(204)
})
