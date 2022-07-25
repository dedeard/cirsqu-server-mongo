import { Schema, model, Document, Model } from 'mongoose'
import autopopulate from 'mongoose-autopopulate'
import { IUserDocument } from './user.model'

export interface IComment {
  user: Schema.Types.ObjectId | IUserDocument
  episode: Schema.Types.ObjectId
  parent: string
  content: string
}

export interface ICommentDocument extends IComment, Document {
  user: IUserDocument
  createdAt: Date
}

export interface ICommentModel extends Model<ICommentDocument> {}

// Schema
export const CommentSchema: Schema<ICommentDocument> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, ref: 'User', required: true, immutable: true, autopopulate: true },
    episode: { type: Schema.Types.ObjectId, ref: 'Episode', required: true, immutable: true },
    parent: { type: String, immutable: true },
    content: { type: String, required: true },
    createdAt: { type: Date, default: Date.now, immutable: true },
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

CommentSchema.plugin(autopopulate)

// Model
const Comment = model<ICommentDocument, ICommentModel>('Comment', CommentSchema)

export default Comment
