import { Schema, model, Document, Model } from 'mongoose'
import { IUserDocument } from './user.model'

export interface IOrder {
  orderId: string
  user: Schema.Types.ObjectId | IUserDocument
  price: Schema.Types.ObjectId
  processed: boolean
  months: number
  grossAmount: string
  status: string
  charge: string
  data: string
  paymentType: string
}

export interface IOrderDocument extends IOrder, Document {}

export interface IOrderModel extends Model<IOrderDocument> {}

export const OrderSchema: Schema<IOrderDocument> = new Schema(
  {
    orderId: { type: String, required: true, unique: true },
    user: { type: Schema.Types.ObjectId, required: true, ref: 'User' },
    price: { type: Schema.Types.ObjectId, required: true, ref: 'Price' },
    processed: { type: Boolean, required: true, default: false },
    months: { type: Number, required: true },
    grossAmount: { type: String, required: true },
    status: { type: String, required: true, default: 'pending' },
    paymentType: { type: String, required: true },
    charge: { type: String, required: true },
    data: { type: String },
  },
  {
    timestamps: true,
    toJSON: {
      transform(doc, ret) {
        ret.id = ret._id
        ret.charge = JSON.parse(ret.charge || '{}')
        ret.data = ret.data ? JSON.parse(ret.data) : null
        delete ret._id
        delete ret.__v
        return ret
      },
    },
  },
)

// Model
//
const Order = model<IOrderDocument, IOrderModel>('Order', OrderSchema)

export default Order
