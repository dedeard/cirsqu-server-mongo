import { Schema, model, Document, Model } from 'mongoose'
import autopopulate from 'mongoose-autopopulate'
import algoliasearch from 'algoliasearch'
import config from '@/config/config'
import { ICategoryDocument } from './category.model'
import { IEpisodeDocument } from './episode.model'

const client = algoliasearch(config.algolia.appId, config.algolia.apiKey)
const index = client.initIndex('lessons')

function formatData(lesson: ILessonDocument) {
  let seconds = 0
  for (const episode of lesson.episodes) {
    seconds += episode.seconds
  }
  return {
    objectID: lesson.id,
    title: lesson.title,
    slug: lesson.slug,
    description: lesson.description,
    seconds: Math.round(seconds),
    episodeCount: lesson.episodes.length,
    categories: lesson.categories.map((category) => ({
      id: category.id,
      name: category.name,
      slug: category.slug,
    })),
    episodes: lesson.episodes.map((episode) => ({
      id: episode.id,
      name: episode.name,
      title: episode.title,
      seconds: episode.seconds,
      pro: episode.pro,
      file: episode.file,
    })),
    createdAt: lesson.createdAt,
    updatedAt: lesson.updatedAt,
  }
}

export interface ILesson {
  title: string
  slug: string
  description: string
  publish: boolean
  categories: Schema.Types.ObjectId[] | ICategoryDocument[]
  episodes: Schema.Types.ObjectId[] | IEpisodeDocument[]
}

export interface ILessonDocument extends ILesson, Document {
  categories: ICategoryDocument[]
  episodes: IEpisodeDocument[]
  createdAt: Date
  updatedAt: Date
}

export interface ILessonModel extends Model<ILessonDocument> {
  reindexAlgolia(): Promise<void>
}

export const LessonSchema: Schema<ILessonDocument> = new Schema(
  {
    title: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
    publish: { type: Boolean, required: true, default: false },
    categories: { type: [Schema.Types.ObjectId], ref: 'Category', autopopulate: true, default: [] },
    episodes: { type: [Schema.Types.ObjectId], ref: 'Episode', autopopulate: true, default: [] },
  },
  {
    timestamps: true,
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

LessonSchema.plugin(autopopulate)

LessonSchema.post('remove', async function () {
  await index.deleteObject(this.id)
})

LessonSchema.post('save', async function () {
  console.log('post save', this.toJSON())
  if (this.publish) {
    const data = formatData(this)
    return await index.partialUpdateObject(data, { createIfNotExists: true })
  }
  await index.deleteObject(this.id)
})

LessonSchema.statics.reindexAlgolia = async function () {
  const lessons = await this.find({ publish: true })
  await index.replaceAllObjects(lessons.map(formatData))
}

// Model
//
const Lesson = model<ILessonDocument, ILessonModel>('Lesson', LessonSchema)

export default Lesson
