import path from 'path'
import fs from 'fs-extra'
import { Schema, model, Document, Model, Types } from 'mongoose'
import mongooseAutoPopulate from 'mongoose-autopopulate'
import crypto from 'crypto'
import sharp from 'sharp'
import moment from 'moment'
import { IRoleDocument } from './role.model'
import config from '@/config/config'
import storageService from '@/services/storage.service'

export interface IUser {
  name: string
  email: string
  password: string
  avatar?: string
  proExpiredAt?: Date
  role?: Types.ObjectId | IRoleDocument
}

export interface IUserDocument extends IUser, Document {
  role?: IRoleDocument
  amIPro: () => boolean
  comparePassword: (password: string) => Promise<boolean>
  generateAvatar: (imgBuff: Buffer) => Promise<void>
  deleteAvatar: () => Promise<void>
}

export interface IUserModel extends Model<IUserDocument> {
  isEmailTaken: (email: string, excludeId?: string) => Promise<boolean>
}

export const UserSchema: Schema<IUserDocument> = new Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    password: { type: String, required: true },
    avatar: { type: String },
    proExpiredAt: { type: Date },
    role: { type: Types.ObjectId, ref: 'Role', autopopulate: true },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id
        ret.pro = doc.amIPro()
        ret.proExpiredAt = ret.pro ? ret.proExpiredAt : null
        ret.role = ret.role ? ret.role : null
        ret.avatar = ret.avatar ? ret.avatar : null
        delete ret.password
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

UserSchema.plugin(mongooseAutoPopulate)

// Hash password before data is seved.
UserSchema.pre('save', function (next) {
  if (this.isModified('password')) {
    const salt = crypto.randomBytes(16).toString('hex')
    return crypto.scrypt(this.password, salt, 64, (err, derivedKey) => {
      if (err) return next(err)
      this.password = salt + ':' + derivedKey.toString('hex')
      return next()
    })
  }
  return next()
})

// Methods
//
UserSchema.methods.amIPro = function (): boolean {
  return this.proExpiredAt ? moment(this.proExpiredAt).diff(moment.now()) > 0 : false
}

UserSchema.methods.comparePassword = function (password: string): Promise<boolean> {
  return new Promise((resolve, reject) => {
    const [salt, key] = this.password.split(':')
    crypto.scrypt(password, salt, 64, (err, derivedKey) => {
      if (err) return reject(err)
      resolve(key === derivedKey.toString('hex'))
    })
  })
}

UserSchema.methods.generateAvatar = async function (imgBuff: Buffer): Promise<void> {
  await fs.ensureDir(path.join(config.uploadDir, 'avatar'))
  const name = 'avatar/' + this._id + '-' + moment().unix() + '.jpg'

  await sharp(imgBuff)
    .resize({ width: 180, height: 180 })
    .toFormat('jpeg')
    .toBuffer()
    .then((buffer) => storageService.saveImage(name, buffer))
    .then(() => storageService.makePublic(name))
  const oldAvatar = this.avatar
  this.avatar = storageService.createUrl(name)
  await this.save()
  if (oldAvatar) {
    await storageService.remove(storageService.normalizeUrl(oldAvatar))
  }
}

UserSchema.methods.deleteAvatar = async function (): Promise<void> {
  if (this.avatar) {
    await storageService.remove(storageService.normalizeUrl(this.avatar))
    this.avatar = undefined
    await this.save()
  }
}

// Statics
//
UserSchema.statics.isEmailTaken = async function (email: string, excludeId: string): Promise<boolean> {
  const count = await this.countDocuments({ email, _id: { $ne: excludeId } })
  return count > 0
}

// Model
//
const User = model<IUserDocument, IUserModel>('User', UserSchema)

export default User
