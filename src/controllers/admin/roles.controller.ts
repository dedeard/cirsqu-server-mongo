import Joi from 'joi'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'
import { uniqueRoleNameLookup } from '@/shared/validationLookup'
import Role from '@/models/role.model'
import { Types } from 'mongoose'
import dataPermissions from '@/config/permissions'

export const getRoles = ca(async (req, res) => {
  const roles = await Role.find()
  res.json(roles)
})

export const getPermissions = ca(async (req, res) => {
  res.json(Object.values(dataPermissions))
})

export const getRole = ca(async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, 'Role is undefined.')
  }
  const role = await Role.findById(req.params.id)
  if (!role) throw new ApiError(404, 'Role is undefined.')
  res.json(role)
})

export const createRole = ca(async (req, res) => {
  let { name, permissions } = req.body
  try {
    const data = await Joi.object({
      name: Joi.string().trim().min(3).max(255).required().external(uniqueRoleNameLookup()),
      permissions: Joi.array()
        .items(Joi.string().valid(...Object.values(dataPermissions)))
        .required(),
    }).validateAsync({ name, permissions }, { abortEarly: false })
    name = data.name
    permissions = [...new Set(data.permissions)]
  } catch (e) {
    throw new ApiError(422, 'Failed to create role.', e)
  }
  const role = await Role.create({ name, permissions })
  res.json(role)
})

export const updateRole = ca(async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, 'Role is undefined.')
  }
  const role = await Role.findById(req.params.id)
  if (!role) throw new ApiError(404, 'Role is undefined.')
  if (role.name === 'Super Admin') throw new ApiError(422, 'Super Admin role cannot be updated.')

  try {
    const data = await Joi.object({
      name: Joi.string().trim().min(3).max(255).required().external(uniqueRoleNameLookup(role.id)),
      permissions: Joi.array()
        .items(Joi.string().valid(...Object.values(dataPermissions)))
        .required(),
    }).validateAsync({ name: req.body.name, permissions: req.body.permissions }, { abortEarly: false })
    role.name = data.name
    role.permissions = [...new Set(data.permissions as string[])]
  } catch (e) {
    throw new ApiError(422, 'Failed to create role.', e)
  }
  await role.save()
  res.json(role)
})

export const deleteRole = ca(async (req, res) => {
  if (!Types.ObjectId.isValid(req.params.id)) {
    throw new ApiError(404, 'Role is undefined.')
  }
  const role = await Role.findById(req.params.id)
  if (!role) throw new ApiError(404, 'Role is undefined.')
  if (role.name === 'Super Admin') throw new ApiError(422, 'Super Admin role cannot be deleted.')

  await role.remove()
  res.sendStatus(204)
})
