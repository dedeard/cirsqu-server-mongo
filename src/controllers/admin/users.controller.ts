import mongoose from 'mongoose'
import Joi from 'joi'
import { UploadedFile } from 'express-fileupload'
import { fromBuffer } from 'file-type'
import User from '@/models/user.model'
import ca from '@/shared/catchAsync'
import ApiError from '@/shared/ApiError'
import { uniqueEmailLookup } from '@/shared/validationLookup'
import logger from '@/config/logger'
import Role from '@/models/role.model'

export const getUsers = ca(async (req, res) => {
  const users = await User.find().sort({ _id: 1 })
  res.json(users)
})

export const getUser = ca(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, 'User is undefined.')
  }
  const user = await User.findById(req.params.id)
  if (!user) throw new ApiError(404, 'User is undefined.')
  res.json(user)
})

export const createUser = ca(async (req, res) => {
  let roles = await Role.find()
  roles = roles.filter((el) => el.name !== 'Super Admin')
  try {
    const { name, email, password, role, proExpiredAt } = req.body
    req.body = await Joi.object({
      name: Joi.string().trim().min(3).max(30).required(),
      password: Joi.string().trim().min(3).max(30).required(),
      email: Joi.string().trim().email().required().external(uniqueEmailLookup()),
      proExpiredAt: Joi.date().allow(null, ''),
      role: Joi.string().valid(null, '', ...roles.map((el) => el.id)),
    }).validateAsync({ name, email, password, proExpiredAt, role }, { abortEarly: false })
  } catch (e) {
    throw new ApiError(422, 'Failed create user.', e)
  }
  const user = await User.create({ ...req.body, role: req.body.role || undefined })
  res.json(user)
})

export const updateUser = ca(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, 'User is undefined.')
  }
  const user = await User.findById(req.params.id)
  if (!user) throw new ApiError(404, 'User is undefined.')

  if (user.role?.name === 'Super Admin' && req.user?.role?.name !== 'Super Admin') {
    throw new ApiError(403, 'You can not update super admin.')
  }

  let roles = await Role.find()
  roles = roles.filter((el) => el.name !== 'Super Admin')
  let { name, email, password, role, proExpiredAt } = req.body
  try {
    req.body = await Joi.object({
      name: Joi.string().trim().min(3).max(30).required().default(user.name),
      password: Joi.string().trim().min(3).max(30).allow(null, ''),
      email: Joi.string().trim().email().required().external(uniqueEmailLookup(user.id)).default(user.email),
      proExpiredAt: Joi.date().allow(null, ''),
      role: Joi.string().valid(null, '', ...roles.map((el) => el.id)),
    }).validateAsync({ name, email, password, role, proExpiredAt }, { abortEarly: false })
  } catch (e) {
    throw new ApiError(422, 'Failed update user.', e)
  }

  if (user.role?.name === 'Super Admin') {
    if (typeof req.body.proExpiredAt !== 'undefined') user.proExpiredAt = req.body.proExpiredAt || undefined
  } else {
    user.name = req.body.name
    user.email = req.body.email
    if (req.body.password) user.password = req.body.password
    if (typeof req.body.proExpiredAt !== 'undefined') user.proExpiredAt = req.body.proExpiredAt || undefined
    if (typeof req.body.role !== 'undefined') user.role = req.body.role || undefined
  }
  await user.save()
  res.json(user)
})

export const updateAvatar = ca(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, 'User is undefined.')
  }

  const user = await User.findById(req.params.id)
  if (!user) throw new ApiError(404, 'User is undefined.')

  const image = req.files?.image
  const data: UploadedFile | undefined = Array.isArray(image) ? image[0] : image
  if (!data) {
    throw new ApiError(422, 'Image is required')
  }
  const mime = await fromBuffer(data.data)
  if (!['jpg', 'png', 'gif'].includes(mime?.ext || '')) {
    throw new ApiError(422, 'Image format must be [jpg, png, gif]')
  }
  await user.generateAvatar(data.data)
  res.json(user)
})

export const deleteUser = ca(async (req, res) => {
  if (!mongoose.Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, 'User is undefined.')
  }
  const user = await User.findById(req.params.id)
  if (!user) throw new ApiError(404, 'User is undefined.')
  if (user.role?.name === 'Super Admin') throw new ApiError(403, 'You can not delete super admin.')

  await user.deleteAvatar().catch((e) => {
    logger.error(e)
  })
  await user.delete()
  res.sendStatus(204)
})
