import { Schema, model, Document, Model } from 'mongoose'
import autopopulate from 'mongoose-autopopulate'
import { IEpisodeDocument } from './episode.model'

export interface IActivity {
  user: Schema.Types.ObjectId
  episode: Schema.Types.ObjectId | IEpisodeDocument
  createdAt: Date
}

export interface IActivityDocument extends IActivity, Document {
  episode: IEpisodeDocument
}

export interface IActivityModel extends Model<IActivityDocument> {}

export const ActivitySchema: Schema<IActivityDocument> = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    episode: { type: Schema.Types.ObjectId, required: true, ref: 'Episode', autopopulate: true },
    createdAt: { type: Date, default: Date.now },
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

ActivitySchema.plugin(autopopulate)

const Activity = model<IActivityDocument, IActivityModel>('Activity', ActivitySchema)

export default Activity
