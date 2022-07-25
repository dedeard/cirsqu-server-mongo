import Joi from 'joi'
import { Types } from 'mongoose'
import Price from '@/models/price.model'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'
import { uniquePriceSlugLookup } from '@/shared/validationLookup'

export const getPrices = ca(async (req, res) => {
  const prices = await Price.find()
  res.json(prices)
})

export const getPrice = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, 'Price not found!')
  }
  const price = await Price.findById(id)
  if (!price) throw new ApiError(404, 'Price not found!')
  res.json(price)
})

export const updatePrice = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) {
    throw new ApiError(404, 'Price not found!')
  }
  let data = await Price.findById(id)
  if (!data) throw new ApiError(404, 'Price not found!')

  try {
    const { name, slug, price, details } = req.body
    req.body = await Joi.object({
      name: Joi.string().trim().min(3).max(255).required(),
      slug: Joi.string().trim().min(3).max(255).external(uniquePriceSlugLookup(id)).required(),
      price: Joi.number().min(1000).required(),
      details: Joi.array().items(Joi.string().min(3).max(255)).min(1).required(),
    }).validateAsync({ name, slug, price, details }, { abortEarly: false })
  } catch (e) {
    throw new ApiError(422, 'Failed to create permission.', e)
  }

  data.name = req.body.name
  data.slug = req.body.slug
  data.price = String(req.body.price)
  data.details = req.body.details

  await data.save()
  res.json(data)
})
