import { NextFunction, Request, Response } from 'express'
import ca from '@/shared/catchAsync'
import ApiError from '@/shared/ApiError'
import * as jwt from '@/services/jwt.service'
import User from '@/models/user.model'

type Options = { can?: string; pro?: boolean; required?: boolean }

class AuthMiddleware {
  req: Request
  next: NextFunction
  options?: Options
  required: boolean

  constructor(req: Request, next: NextFunction, options?: Options) {
    this.req = req
    this.next = next
    this.options = options
    this.required = options?.required ?? true
  }

  async checkAuth(): Promise<void> {
    const bearer = this.parseBearerToken(this.req)
    if (!bearer && this.required) throw new ApiError(401, 'Bearer token is required')

    let payload: jwt.IToken | null = null
    try {
      payload = jwt.verifyToken(bearer || '')
    } catch (e: any) {
      if (this.required) {
        switch (e.name) {
          case 'TokenExpiredError':
            throw new ApiError(401, 'Token expired')
          case 'JsonWebTokenError':
            throw new ApiError(401, 'Invalid token')
          default:
            throw new ApiError(401, 'Invalid token')
        }
      }
    }

    if (payload) {
      const user = await User.findById(payload.uid)
      if (!user) throw new ApiError(401, 'Invalid token')

      if (this.options?.can && user.role?.name !== 'Super Admin') {
        const exist = user.role?.permissions.find((el) => el === this.options?.can)
        if (!exist) throw new ApiError(403, 'Forbidden')
      }

      if (this.options?.pro && !user.amIPro()) {
        throw new ApiError(403, 'Forbidden')
      }

      this.req.user = user
    }

    this.next()
  }

  parseBearerToken(req: Request): string | null {
    const auth = req.headers ? req.headers.authorization || null : null
    if (!auth) return null

    const parts = auth.split(' ')
    if (parts.length < 2) return null

    const schema = (parts.shift() as string).toLowerCase()
    const token = parts.join(' ')
    if (schema !== 'bearer') return null

    return token
  }
}

export function auth(options?: Options): (req: Request, res: Response, next: NextFunction) => void {
  return ca(async (req, res, next) => {
    const authentication = new AuthMiddleware(req, next, options)
    await authentication.checkAuth()
  })
}
