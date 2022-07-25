import Price from '@/models/price.model'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'

/**
 * Get all prices
 * GET /prices
 *
 */
export const getPrices = ca(async (req, res) => {
  const prices = await Price.find()
  res.json(prices)
})

/**
 * Get a price
 * GET /prices/:slug
 *
 */
export const getPrice = ca(async (req, res) => {
  const slug = req.params.slug
  const price = await Price.findOne({ slug })
  if (!price) throw new ApiError(404, 'Price list not found!')
  res.json(price)
})
