import { Types } from 'mongoose'
import Episode from '@/models/episode.model'
import { createSignedUrl, createUrl } from '@/services/storage.service'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'

/**
 * Get episode url
 * GET /episodes/:episodeId/url
 *
 */
export const getEpisodeUrl = ca(async (req, res) => {
  const episodeId = req.params.episodeId
  if (!Types.ObjectId.isValid(episodeId)) throw new ApiError(400, 'Episode id is invalid.')
  const episode = await Episode.findById(episodeId)
  if (!episode) throw new ApiError(404, 'Episode not found.')
  let url: string

  if (!episode.pro) return res.json({ url: createUrl(episode.name) })

  if (!req.user) throw new ApiError(401, 'You must be logged in to get the url.')
  if (!req.user.amIPro()) throw new ApiError(403, 'You must be a pro to get the url.')

  res.json({ url: await createSignedUrl(episode.name) })
})
