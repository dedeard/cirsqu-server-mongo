import { Types } from 'mongoose'
import Activity from '@/models/activity.model'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'
import Lesson from '@/models/lesson.model'
import config from '@/config/config'

/**
 * Get activities
 * GET /activities
 *
 */
export const getActivities = ca(async (req, res) => {
  const activities = await Activity.find({ user: req.user.id }).sort({ createdAt: 'desc' })
  res.json(activities)
})

/**
 * Create activity
 * POST /activities/:lessonId/:episodeId
 *
 */
export const createActivity = ca(async (req, res) => {
  const lessonId = req.params.lessonId
  const episodeId = req.params.episodeId
  if (!Types.ObjectId.isValid(lessonId)) throw new ApiError(400, 'Lesson id is invalid.')
  if (!Types.ObjectId.isValid(episodeId)) throw new ApiError(400, 'Episode id is invalid.')

  const lesson = await Lesson.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Eesson not found.')
  const episode = lesson.episodes.find((el) => el.id === episodeId)
  if (!episode) throw new ApiError(404, 'Episode not found.')

  await Activity.deleteMany({ lesson: lessonId, user: req.user.id })
  const activity = await Activity.create({
    user: req.user.id,
    lesson: lessonId,
    episode: episodeId,
  })

  const activities = await Activity.find({ user: req.user.id }).sort({ createdAt: 'asc' })
  if (activities.length > config.activityLength) await activities[0].delete()
  res.json(activity)
})
