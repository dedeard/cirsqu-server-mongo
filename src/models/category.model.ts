import { Schema, model, Document, Model } from 'mongoose'
import algoliasearch from 'algoliasearch'
import config from '@/config/config'

const client = algoliasearch(config.algolia.appId, config.algolia.apiKey)
const index = client.initIndex('categories')

function formatData(category: ICategoryDocument) {
  return {
    objectID: category.id,
    name: category.name,
    slug: category.slug,
    description: category.description,
    createdAt: category.createdAt,
    updatedAt: category.updatedAt,
  }
}

export interface ICategory {
  name: string
  slug: string
  description: string
}

export interface ICategoryDocument extends ICategory, Document {
  createdAt: Date
  updatedAt: Date
}

export interface ICategoryModel extends Model<ICategoryDocument> {
  reindexAlgolia(): Promise<void>
}

export const CategorySchema: Schema<ICategoryDocument> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    description: { type: String, required: true },
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

CategorySchema.post('remove', async function () {
  await index.deleteObject(this.id)
})

CategorySchema.post('save', async function () {
  const data = formatData(this)
  await index.partialUpdateObject(data, { createIfNotExists: true })
})

CategorySchema.statics.reindexAlgolia = async function () {
  const categories = await this.find()
  await index.replaceAllObjects(categories.map(formatData))
}

const Category = model<ICategoryDocument, ICategoryModel>('Category', CategorySchema)

export default Category
