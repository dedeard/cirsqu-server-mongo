import { Schema, model, Document, Model } from 'mongoose'

export interface IRole {
  name: string
  permissions: string[]
}

export interface IRoleDocument extends IRole, Document {}

export interface IRoleModel extends Model<IRoleDocument> {}

export const RoleSchema: Schema<IRoleDocument> = new Schema(
  {
    name: { type: String, required: true, unique: true },
    permissions: [{ type: String }],
  },
  {
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

const Role = model<IRoleDocument, IRoleModel>('Role', RoleSchema)

export default Role
