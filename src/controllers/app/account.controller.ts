import Joi from 'joi'
import { UploadedFile } from 'express-fileupload'
import { fromBuffer } from 'file-type'
import Pusher from 'pusher'
import ca from '@/shared/catchAsync'
import { passwordMatchLookup } from '@/shared/validationLookup'
import ApiError from '@/shared/ApiError'
import { IUserDocument } from '@/models/user.model'
import config from '@/config/config'

const pusher = new Pusher(config.pusher)

/**
 * Get profile
 * GET /account/profile
 *
 */
export const getProfile = ca((req, res) => {
  res.json(req.user)
})

/**
 * Update profile
 * PUT /account/profile
 *
 */
export const updateProfile = ca(async (req, res) => {
  const user = req.user as IUserDocument
  try {
    const { name, password, newPassword } = req.body
    req.body = await Joi.object({
      name: Joi.string().trim().min(3).max(30),
      newPassword: Joi.string().trim().min(3).max(30),
      password: Joi.when('newPassword', {
        then: Joi.string().trim().required().external(passwordMatchLookup(user)),
        otherwise: Joi.when('email', {
          then: Joi.string().trim().required().external(passwordMatchLookup(user)),
        }),
      }),
    }).validateAsync({ name, password, newPassword }, { abortEarly: false })
  } catch (e) {
    throw new ApiError(422, 'Failed to update profile.', e)
  }

  if (req.body.name) user.name = req.body.name
  if (req.body.newPassword) user.password = req.body.newPassword
  await user.save()
  res.json(user)
})

/**
 * Update profile avatar
 * PUT /account/avatar
 *
 */
export const updateAvatar = ca(async (req, res) => {
  const image = req.files?.image
  const data: UploadedFile | undefined = Array.isArray(image) ? image[0] : image
  if (!data) throw new ApiError(422, 'Image is required')

  const mime = await fromBuffer(data.data)
  if (!['jpg', 'png', 'gif'].includes(mime?.ext || '')) {
    throw new ApiError(422, 'Image format must be [jpg, png, gif]')
  }
  await req.user.generateAvatar(data.data)
  res.json(req.user)
})

/**
 * Login pusher
 * POST /account/account/login-pusher
 *
 */
export const pusherLogin = ca(async (req, res) => {
  const socketId = req.body.socket_id
  const user = req.user as IUserDocument
  const authResponse = pusher.authenticateUser(socketId, {
    id: user.id,
  })
  res.json(authResponse)
})
