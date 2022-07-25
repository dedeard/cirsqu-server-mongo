import { randomUUID } from 'crypto'
import jwt from 'jsonwebtoken'
import moment from 'moment'
import { IUserDocument } from '@/models/user.model'
import config from '@/config/config'

export interface IToken {
  uid: string
  jti: string
  exp: number
  iat: number
}

export const generateToken = (user: IUserDocument): { bearer: string; expiredAt: Date } => {
  const iat = moment().unix()
  const exp = moment().add(config.jwt.expDays, 'days')
  const payload: IToken = {
    uid: user.id,
    exp: exp.unix(),
    iat,
    jti: user.id + randomUUID(),
  }
  return {
    bearer: jwt.sign(payload, config.jwt.secret),
    expiredAt: exp.toDate(),
  }
}

export const verifyToken = (token: string): IToken => {
  return jwt.verify(token, config.jwt.secret) as IToken
}
