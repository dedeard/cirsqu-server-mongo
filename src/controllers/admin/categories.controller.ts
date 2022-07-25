import Joi from 'joi'
import slugify from 'slugify'
import { Types } from 'mongoose'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'
import { uniqueCategoryNameLookup } from '@/shared/validationLookup'
import Category from '@/models/category.model'

export const getCategories = ca(async (req, res) => {
  const categoies = await Category.find()
  res.json(categoies)
})

export const getCategory = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Category id is invalid.')
  let category = await Category.findById(id)
  if (!category) throw new ApiError(404, 'Category not found.')
  res.json(category)
})

export const createCategory = ca(async (req, res) => {
  let { name, description } = req.body
  try {
    const data = await Joi.object({
      name: Joi.string().trim().max(64).required().external(uniqueCategoryNameLookup()),
      description: Joi.string().trim().max(300).required(),
    }).validateAsync({ name, description }, { abortEarly: false })
    name = data.name
    description = data.description
  } catch (e) {
    throw new ApiError(422, 'Failed to create category.', e)
  }
  const category = await Category.create({ name, slug: slugify(name, { lower: true }), description })
  res.json(category)
})

export const updateCategory = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Category id is invalid.')
  let category = await Category.findById(id)
  if (!category) throw new ApiError(404, 'Category not found.')

  let { name, description } = req.body
  try {
    const data = await Joi.object({
      name: Joi.string().trim().max(64).required().external(uniqueCategoryNameLookup(id)),
      description: Joi.string().trim().max(300).required(),
    }).validateAsync({ name, description }, { abortEarly: false })
    name = data.name
    description = data.description
  } catch (e) {
    throw new ApiError(422, 'Failed to create category.', e)
  }

  category.name = name
  category.slug = slugify(name, { lower: true })
  category.description = description
  await category.save()

  res.json(category)
})

export const deleteCategory = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Category id is invalid.')
  const category = await Category.findById(id)
  if (!category) throw new ApiError(404, 'Category not found.')
  await category.remove()
  res.sendStatus(204)
})
