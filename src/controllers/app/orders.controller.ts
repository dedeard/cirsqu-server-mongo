import { randomUUID } from 'crypto'
import midtransClient from 'midtrans-client'
import mongoose from 'mongoose'
import { Types } from 'mongoose'
import Pusher from 'pusher'
import config from '@/config/config'
import logger from '@/config/logger'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'
import Order from '@/models/order.model'
import Price from '@/models/price.model'
import moment from 'moment'

const pusher = new Pusher(config.pusher)

/**
 * Get all orders
 * GET /orders
 *
 */
export const getOrders = ca(async (req, res) => {
  const orders = await Order.find({ user: req.user.id }).sort({ createdAt: -1 })
  res.json(orders)
})

/**
 * Get a order
 * GET /orders/:id
 *
 */
export const getOrder = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Order not found!')
  const order = await Order.findOne({ user: req.user.id, id })
  if (!order) throw new ApiError(404, 'Order not found!')
  res.json(order)
})

/**
 * Cancel a order
 * PUT /orders/:id/cancel
 *
 */
export const cancelOrder = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Order not found!')
  let order = await Order.findOne({ user: req.user.id, id, status: 'pending' })
  if (!order) throw new ApiError(404, 'Order not found!')
  const core = new midtransClient.CoreApi({
    isProduction: false,
    serverKey: config.midtrans.serverKey,
    clientKey: config.midtrans.clientKey,
  })
  const charge = await core.transaction.cancel(order.orderId)
  order.charge = JSON.stringify(charge)
  await order.save()
  res.json(order)
})

/**
 * Checkout a order
 * POST /orders/checkout/:priceId/:paymentType
 *
 */
export const checkout = ca(async (req, res) => {
  const id = req.params.priceId
  const paymentType = req.params.paymentType

  const paymentTypes = ['bri', 'bca', 'bni', 'indomaret', 'alfamart']
  if (!paymentTypes.includes(paymentType)) throw new ApiError(400, 'Invalid payment type!')
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Order id is invalid!')
  const price = await Price.findById(id)
  if (!price) throw new ApiError(404, 'Price  not found!')

  const orderCount = await Order.countDocuments({ userId: req.user.id, status: 'pending' })
  if (orderCount > 0) throw new ApiError(401, 'Please complete your old order!')

  const core = new midtransClient.CoreApi({
    isProduction: false,
    serverKey: config.midtrans.serverKey,
    clientKey: config.midtrans.clientKey,
  })

  const orderId = randomUUID()

  const parameter: any = {
    transaction_details: {
      order_id: orderId,
      gross_amount: price.price,
      userId: req.user.id,
      priceId: price.id,
      month: price.months,
    },
  }

  if (['bri', 'bca', 'bni'].includes(paymentType)) {
    parameter.payment_type = 'bank_transfer'
    parameter.bank_transfer = {
      bank: paymentType,
    }
  } else {
    parameter.payment_type = 'cstore'
    parameter.cstore = {
      store: paymentType,
    }
  }

  const charge = await core.charge(parameter)

  const order = await Order.create({
    charge: JSON.stringify(charge),
    orderId,
    user: req.user.id,
    price: price.id,
    grossAmount: price.price,
    months: price.months,
    paymentType,
  })
  order.user = req.user
  res.json(order)
})

/**
 * Handle payment notification
 * POST /orders/notification/handling
 *
 */
export const notification = ca(async (req, res) => {
  const data = req.body
  let orderId = data.order_id
  let transactionStatus = data.transaction_status

  const order = await Order.findOne({ orderId }).populate('user')
  if (!order) throw new ApiError(404, 'Order not found!')

  const user = order.user as any

  logger.info(`[TRANSACTION NOTIFICATION RECEIVED] Order ID: ${orderId}. Transaction status: ${transactionStatus}`)

  if (transactionStatus) {
    order.status = transactionStatus
    order.data = JSON.stringify(data)
    const session = await mongoose.startSession()
    if (transactionStatus === 'settlement' && !order.processed) {
      await session.withTransaction(async () => {
        if (user.amIPro()) {
          user.proExpiredAt = moment(user.proExpiredAt).add(order.months, 'months').toDate()
        } else {
          user.proExpiredAt = moment().add(order.months, 'months').toDate()
        }
        await user.save()

        order.processed = true
        await order.save()
      })
    } else if (order.status === 'settlement' && transactionStatus === 'deny' && order.processed) {
      await session.withTransaction(async () => {
        user.proExpiredAt = moment(user.proExpiredAt).add(-order.months, 'months').toDate()
        await user.save()
        order.processed = false
        await order.save()
      })
    } else {
      await session.withTransaction(async (session) => {
        await order.save()
      })
    }

    await session.endSession()
  }

  await pusher.sendToUser(user.id, 'order-notification', order.toJSON())

  res.sendStatus(200)
})
