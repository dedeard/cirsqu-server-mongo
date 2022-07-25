import Joi from 'joi'
import Forgot, { IForgotDocument } from '@/models/forgot.model'
import User from '@/models/user.model'
import * as jwtService from '@/services/jwt.service'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'
import { registeredEmailLookup, uniqueEmailLookup } from '@/shared/validationLookup'
import sendResetPasswordEmail from '@/queue/resetPasswordEmailNotificationQueue'

/**
 * Register
 * POST /auth/register
 *
 */
export const register = ca(async (req, res) => {
  try {
    const { name, email, password } = req.body
    req.body = await Joi.object({
      name: Joi.string().trim().min(3).max(30).required(),
      password: Joi.string().trim().min(3).max(30).required(),
      email: Joi.string().trim().email().required().external(uniqueEmailLookup()),
    }).validateAsync({ name, email, password }, { abortEarly: false })
  } catch (e) {
    throw new ApiError(422, 'Failed register.', e)
  }

  await User.create(req.body)
  res.sendStatus(204)
})

/**
 * Login
 * POST /auth/login
 *
 */
export const login = ca(async (req, res) => {
  try {
    const { email, password } = req.body
    req.body = await Joi.object({
      password: Joi.string().trim().required(),
      email: Joi.string().trim().email().required(),
    }).validateAsync({ email, password }, { abortEarly: false })
  } catch (e) {
    throw new ApiError(422, 'Failed login.', e)
  }

  const user = await User.findOne({ email: req.body.email })
  if (user && (await user.comparePassword(req.body.password))) {
    return res.json({
      user,
      token: jwtService.generateToken(user),
    })
  }
  throw new ApiError(400, 'Password and Username combination is invalid.')
})

/**
 * Forgot password
 * POST /auth/password
 *
 */
export const forgotPassword = ca(async (req, res) => {
  try {
    req.body = await Joi.object({
      email: Joi.string().trim().email().required().external(registeredEmailLookup()),
    }).validateAsync({ email: req.body.email }, { abortEarly: false })
  } catch (e) {
    throw new ApiError(422, 'Failed to generate forgotten password code.', e)
  }
  const code = await Forgot.generateForgotPasswordCode(req.body.email)
  const job = sendResetPasswordEmail.createJob({ code, email: req.body.email })
  await job.save()
  res.sendStatus(204)
})

/**
 * Verify password reset code
 * POST /auth/password/verify-code
 *
 */
export const verifyResetPasswordCode = ca(async (req, res) => {
  try {
    const { code, email } = req.body
    req.body = await Joi.object({
      code: Joi.string().required(),
      email: Joi.string().email().required(),
    }).validateAsync({ code, email }, { abortEarly: false })
  } catch (e) {
    throw new ApiError(422, 'Failed to verify reset password code.', e)
  }

  try {
    await Forgot.verifyForgotPasswordCode(req.body.code, req.body.email)
  } catch (e: any) {
    throw new ApiError(400, e.message)
  }
  res.sendStatus(204)
})

/**
 * Reset password
 * PUT /auth/password
 *
 */
export const resetPassword = ca(async (req, res) => {
  try {
    const { code, email, password } = req.body
    req.body = await Joi.object({
      code: Joi.string().required(),
      email: Joi.string().email().required(),
      password: Joi.string().trim().min(3).max(30).required(),
    }).validateAsync({ code, email, password }, { abortEarly: false })
  } catch (e) {
    throw new ApiError(422, 'Failed to reset your password.', e)
  }

  let instance: IForgotDocument
  try {
    instance = await Forgot.verifyForgotPasswordCode(req.body.code, req.body.email)
  } catch (e: any) {
    throw new ApiError(400, e.message)
  }
  const user = await User.findOne({ email: instance.email })
  if (user) {
    user.password = req.body.password
    await user.save()
    await instance.delete()
  } else {
    throw new ApiError(400, 'Your account has been deleted.')
  }
  res.sendStatus(204)
})
