import Joi from 'joi'
import slugify from 'slugify'
import { Types } from 'mongoose'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'
import { uniqueLessonTitleLookup } from '@/shared/validationLookup'
import Lesson from '@/models/lesson.model'
import Category from '@/models/category.model'

export const getLessons = ca(async (req, res) => {
  const lessons = await Lesson.find()
  res.json(lessons)
})

export const getLesson = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Lesson id is invalid.')
  const lesson = await Lesson.findById(id)
  if (!lesson) throw new ApiError(404, 'Lesson not found.')

  res.json(lesson)
})

export const createLesson = ca(async (req, res) => {
  let { title, description, categories } = req.body
  const validCategories = await Category.find().select('_id')
  try {
    const data = await Joi.object({
      title: Joi.string()
        .trim()
        .min(3)
        .max(200)
        .required()
        .external(uniqueLessonTitleLookup())
        .messages({ 'any.unique': 'Invalid category id.' }),
      description: Joi.string().trim().min(3).max(500).required(),
      categories: Joi.array()
        .items(Joi.string().valid(...validCategories.map((el) => el.id)))
        .messages({ 'any.only': 'Invalid category id.' })
        .required()
        .default([]),
    }).validateAsync({ title, description, categories }, { abortEarly: false })
    title = data.title
    description = data.description
    categories = [...new Set(data.categories)]
  } catch (e) {
    console.log(e)
    throw new ApiError(422, 'Failed to create lesson.', e)
  }

  const lesson = await Lesson.create({
    title,
    slug: slugify(title, { lower: true }),
    description,
    categories,
  })

  res.json(lesson)
})

export const updateLesson = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Lesson id is invalid.')
  const lesson = await Lesson.findById(id)
  if (!lesson) throw new ApiError(404, 'Lesson not found.')
  let { title, description, categories, publish } = req.body

  const validCategories = await Category.find().select('_id')
  try {
    const data = await Joi.object({
      title: Joi.string().trim().min(3).max(200).required().external(uniqueLessonTitleLookup(id)),
      description: Joi.string().trim().min(3).max(500).required(),
      publish: Joi.boolean().required(),
      categories: Joi.array()
        .items(Joi.string().valid(...validCategories.map((el) => el.id)))
        .messages({ 'any.only': 'Invalid category id.' })
        .required()
        .default([]),
    }).validateAsync({ title, description, categories, publish }, { abortEarly: false })
    title = data.title
    description = data.description
    categories = [...new Set(data.categories)]
    publish = data.publish
  } catch (e) {
    throw new ApiError(422, 'Failed to update lesson.', e)
  }

  lesson.title = title
  lesson.slug = slugify(title, { lower: true })
  lesson.description = description
  lesson.publish = publish
  lesson.categories = categories

  await lesson.save()

  res.json(lesson)
})

export const deletelesson = ca(async (req, res) => {
  const id = req.params.id
  if (!Types.ObjectId.isValid(id)) throw new ApiError(404, 'Lesson id is invalid.')
  const lesson = await Lesson.findById(id)
  if (!lesson) throw new ApiError(404, 'Lesson not found.')

  await lesson.remove()

  res.sendStatus(204)
})
