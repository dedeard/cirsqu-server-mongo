import Joi from 'joi'
import slugify from 'slugify'
import User, { IUserDocument } from '@/models/user.model'
import Role from '@/models/role.model'
import Price from '@/models/price.model'
import Category from '@/models/category.model'
import Lesson from '@/models/lesson.model'

export const uniqueEmailLookup =
  (exludeId?: string): Joi.ExternalValidationFunction =>
  async (val) => {
    const exists = await User.isEmailTaken(val, exludeId)
    if (exists) {
      throw new Joi.ValidationError('"Email" already exists.', [{ message: '"Email" already exists.', path: ['email'] }], val)
    }
  }

export const registeredEmailLookup =
  (exludeId?: string): Joi.ExternalValidationFunction =>
  async (val) => {
    const exists = await User.isEmailTaken(val, exludeId)
    if (!exists) {
      throw new Joi.ValidationError('"Email" is not registered.', [{ message: '"Email" is not registered.', path: ['email'] }], val)
    }
  }

export const passwordMatchLookup =
  (user: IUserDocument): Joi.ExternalValidationFunction =>
  async (val) => {
    const match = await user.comparePassword(val)
    if (!match) {
      throw new Joi.ValidationError('"Password" is not valid.', [{ message: '"Password" is not valid', path: ['password'] }], val)
    }
  }

export const uniqueRoleNameLookup =
  (exludeId?: string): Joi.ExternalValidationFunction =>
  async (val) => {
    const exists = await Role.countDocuments({ name: val, _id: { $ne: exludeId } })
    if (exists) {
      throw new Joi.ValidationError('"Name" already exists.', [{ message: '"Name" already exists.', path: ['name'] }], val)
    }
  }

export const uniquePriceSlugLookup =
  (exludeId?: string): Joi.ExternalValidationFunction =>
  async (slug) => {
    const count = await Price.countDocuments({ _id: { $ne: exludeId }, slug })
    if (count > 0) {
      throw new Joi.ValidationError('"Slug" already exists.', [{ message: '"Slug" already exists.', path: ['slug'] }], slug)
    }
  }

export const uniqueCategoryNameLookup =
  (exludeId?: string): Joi.ExternalValidationFunction =>
  async (val) => {
    const count = await Category.countDocuments({ slug: slugify(val, { lower: true }), _id: { $ne: exludeId } })
    if (count > 0) {
      throw new Joi.ValidationError('"Name" already exists.', [{ message: '"Name" already exists.', path: ['name'] }], val)
    }
  }

export const uniqueLessonTitleLookup =
  (exludeId?: string): Joi.ExternalValidationFunction =>
  async (val) => {
    const count = await Lesson.countDocuments({ slug: slugify(val, { lower: true }), _id: { $ne: exludeId } })
    if (count > 0) {
      throw new Joi.ValidationError('"Title" already exists.', [{ message: '"Title" already exists.', path: ['title'] }], val)
    }
  }
