import mongoose from 'mongoose'
import config from './config'
import logger from './logger'

mongoose.connection.on('connected', () => {
  logger.info('[MONGO DB] Connected')
})

mongoose.connection.on('disconnected', () => {
  logger.warn('[MONGO DB] Disconnected')
})

mongoose.connection.on('reconnected', () => {
  logger.warn('[MONGO DB] Reconnected')
})

export async function connect() {
  await mongoose.connect(String(config.mongodbUrl)).catch((err) => {
    logger.error('[MONGO DB] ' + err)
  })
}

export async function disconnect() {
  await mongoose.disconnect().catch((err) => {
    logger.error('[MONGO DB] ' + err)
  })
}
