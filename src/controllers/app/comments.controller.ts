import { Types } from 'mongoose'
import Joi from 'joi'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'
import Comment from '@/models/comment.model'
import redisCache from '@/config/cache'
import Episode from '@/models/episode.model'

/**
 * Get all episode comments
 * GET /comments/:episodeId
 *
 */
export const getComments = ca(async (req, res) => {
  const episodeId = req.params.episodeId
  if (!Types.ObjectId.isValid(episodeId)) throw new ApiError(404, 'Post not found')
  const response = await redisCache.wrap(`episode:${episodeId}:comments`, async () => {
    const comments = await Comment.find({ episode: episodeId }).sort({ createdAt: -1 })
    return comments
      .filter((comment) => !comment.parent)
      .map((comment) => {
        const obj: any = { ...comment.toJSON(), replies: [] }
        obj.replies = comments.filter(({ parent }) => parent === comment.id.toString())
        return obj
      })
  })
  res.json(response)
})

/**
 * Create a new comment
 * POST /comments/:episodeId
 *
 */
export const createComment = ca(async (req, res) => {
  const episodeId = req.params.episodeId
  const userId = req.user.id

  if (!Types.ObjectId.isValid(episodeId)) throw new ApiError(400, 'Episode id is invalid.')
  const episode = await Episode.findById(episodeId)
  if (!episode) throw new ApiError(404, 'Episode not found.')

  let { content } = req.body
  try {
    const data = await Joi.object({
      content: Joi.string().trim().min(3).max(500).required(),
    }).validateAsync({ content }, { abortEarly: false })
    content = data.content
  } catch (e) {
    throw new ApiError(422, 'Failed to create comment', e)
  }

  const comment = await Comment.create({ content, user: userId, episode: episodeId })
  await redisCache.del(`episode:${episodeId}:comments`)
  res.json(comment)
})

/**
 * Delete a comment
 * DELETE /comments/:commentId
 *
 */
export const deleteComment = ca(async (req, res) => {
  const userId = req.user.id
  const commentId = req.params.commentId
  if (!Types.ObjectId.isValid(commentId)) throw new ApiError(404, 'Comment not found')
  const comment = await Comment.findOne({ _id: commentId, user: userId })
  if (!comment) throw new ApiError(404, 'Comment not found')
  await Promise.all([Comment.deleteMany({ parent: commentId }), comment.remove(), redisCache.del(`episode:${comment.episode}:comments`)])
  res.sendStatus(204)
})

/**
 * Create a new reply to a comment
 * POST /replies/:commentId
 *
 */
export const createReply = ca(async (req, res) => {
  const userId = req.user.id
  const commentId = req.params.commentId
  if (!Types.ObjectId.isValid(commentId)) throw new ApiError(400, 'Comment id is invalid.')
  const comment = await Comment.findOne({ _id: commentId, parent: null })
  if (!comment) throw new ApiError(404, 'Comment not found')

  let { content } = req.body
  try {
    const data = await Joi.object({
      content: Joi.string().trim().min(3).max(500).required(),
    }).validateAsync({ content }, { abortEarly: false })
    content = data.content
  } catch (e) {
    throw new ApiError(422, 'Failed to create reply', e)
  }

  const reply = await Comment.create({ content, user: userId, parent: commentId, episode: comment.episode })
  await redisCache.del(`episode:${comment.episode}:comments`)
  res.json(reply)
})

/**
 * Delete a reply to a comment
 * DELETE /replies/:replyId
 *
 */
export const deleteReply = ca(async (req, res) => {
  const userId = req.user.id
  const replyId = req.params.replyId
  if (!Types.ObjectId.isValid(replyId)) throw new ApiError(404, 'Reply not found')
  const reply = await Comment.findOne({ _id: replyId, user: userId, parent: { $ne: null } })
  if (!reply) throw new ApiError(404, 'Reply not found')
  await Promise.all([reply.remove(), redisCache.del(`episode:${reply.episode}:comments`)])
  res.sendStatus(204)
})
