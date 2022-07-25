import { Types } from 'mongoose'
import Activity from '@/models/activity.model'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'
import Episode from '@/models/episode.model'
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
 * POST /activities/:episodeId
 *
 */
export const createActivity = ca(async (req, res) => {
  const episodeId = req.params.episodeId
  if (!Types.ObjectId.isValid(episodeId)) {
    throw new ApiError(400, 'Episode id is invalid.')
  }
  const episode = await Episode.findById(episodeId)
  if (!episode) throw new ApiError(404, 'Episode not found.')

  await Activity.deleteMany({ episode: episodeId, user: req.user.id })
  const activity = await Activity.create({
    user: req.user.id,
    episode: episodeId,
  })
  const activities = await Activity.find({ user: req.user.id }).sort({ createdAt: 'asc' })
  if (activities.length > config.activityLength) await activities[0].delete()
  res.json(activity)
})
