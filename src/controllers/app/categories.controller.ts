import Lesson from '@/models/lesson.model'
import ApiError from '@/shared/ApiError'
import redisCache from '@/config/cache'
import Category from '@/models/category.model'
import ca from '@/shared/catchAsync'

export const getCategories = ca(async (req, res) => {
  const categories = await redisCache.wrap('categories', async () => {
    const data = await Category.find()
    return data
  })
  res.json(categories)
})

export const getCategory = ca(async (req, res) => {
  const slug = req.params.slug
  const data = await redisCache.wrap(`category:${slug}`, async () => {
    const category = await Category.findOne({ slug })
    if (!category) throw new ApiError(404, 'Category not found')
    const lessons = await Lesson.find({ categories: { $in: category.id } })
    return { category, lessons }
  })
  res.json(data)
})
