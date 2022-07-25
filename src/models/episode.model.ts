import { Schema, model, Document, Model } from 'mongoose'

export interface IEpisode {
  title: string
  name: string
  seconds: number
  pro: boolean
  file: string
}

export interface IEpisodeDocument extends IEpisode, Document {}

export interface IEpisodeModel extends Model<IEpisodeDocument> {}

export const EpisodeSchema: Schema<IEpisodeDocument> = new Schema(
  {
    name: { type: String, required: true, unique: true, immutable: true },
    title: { type: String, required: true },
    seconds: { type: Number, default: 0 },
    pro: { type: Boolean, required: true, default: true },
    file: { type: String, default: '' },
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

const Episode = model<IEpisodeDocument, IEpisodeModel>('Episode', EpisodeSchema)

export default Episode
