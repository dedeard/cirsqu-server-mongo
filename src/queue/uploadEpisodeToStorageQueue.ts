import Queue from 'bee-queue'
import config from '@/config/config'
import fs from 'fs-extra'
import path from 'path'
import { uploadFile } from '@/services/storage.service'
import logger from '@/config/logger'

const uploadEpisodeToStorageQueue = new Queue('upload-storage-to-storage', {
  redis: {
    port: config.redis.port,
    host: config.redis.host,
    auth_pass: config.redis.pass,
  },
})

export default uploadEpisodeToStorageQueue

uploadEpisodeToStorageQueue.process(async (job) => {
  const { name } = job.data
  const fullPath = path.join(config.uploadDir, name)
  if (await fs.pathExists(fullPath)) {
    logger.info(`[UPLOADING TO STORAGE] Uploading ${name} to storage`)
    await uploadFile(name, fullPath)
    await fs.remove(fullPath)
  }
})
