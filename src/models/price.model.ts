import { Schema, model, Document, Model } from 'mongoose'

export interface IPrice {
  name: string
  slug: string
  details: string[]
  months: number
  price: string
}

export interface IPriceDocument extends IPrice, Document {}

export interface IPriceModel extends Model<IPriceDocument> {}

export const PriceSchema: Schema<IPriceDocument> = new Schema(
  {
    name: { type: String, required: true },
    slug: { type: String, required: true, unique: true },
    details: [{ type: String, required: true }],
    months: { type: Number, required: true },
    price: { type: String, required: true },
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

// Model
//
const Price = model<IPriceDocument, IPriceModel>('Price', PriceSchema)

export default Price
