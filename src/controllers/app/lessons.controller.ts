import { Types } from 'mongoose'
import Lesson from '@/models/lesson.model'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'
import redisCache from '@/config/cache'

export const getLessons = ca(async (req, res) => {
  let userId = String(req.query.author || '')
  let limit = Number(req.query.limit) || 8
  let skip = String(req.query.skip || '')

  if (limit <= 0) limit = 8
  if (!Types.ObjectId.isValid(skip)) skip = ''
  if (!Types.ObjectId.isValid(userId)) userId = ''

  const key = `lessons:${skip}:${limit}:${userId}`
  const lessons = await redisCache.wrap(key, async () => {
    const query: any = { publish: true }
    if (userId) query.user = userId
    if (skip) {
      const skiped = await Lesson.findById(skip).select('createdAt')
      if (skiped) query.createdAt = { $lt: skiped.createdAt }
    }
    const data = await Lesson.find(query).limit(limit).sort({ createdAt: -1 })
    return data
  })
  res.json(lessons)
})

export const getLesson = ca(async (req, res) => {
  const slug = req.params.slug
  const key = `lessons:${slug}`
  const lesson = await redisCache.wrap(key, async () => {
    const lesson = await Lesson.findOne({ slug, publish: true })
    if (!lesson) throw new ApiError(404, 'Lesson not found')
    return lesson
  })
  res.json(lesson)
})
