import { SaveOptions, Storage } from '@google-cloud/storage'
import config from '@/config/config'
import moment from 'moment'

const storage = new Storage({
  apiEndpoint: config.gc.useEmulator ? config.gc.apiEndpoint : undefined,
  credentials: config.gc.key,
  projectId: config.gc.key.project_id,
})
const bucket = storage.bucket(String(config.gc.bucketName))

export async function saveImage(name: string, data: string | Buffer, option?: SaveOptions): Promise<void> {
  await bucket.file(name).save(data, option || { contentType: 'image/jpeg' })
}

export async function uploadFile(name: string, tmpName: string): Promise<void> {
  await bucket.upload(tmpName, {
    destination: name,
  })
}

export async function exists(name: string): Promise<boolean> {
  return (await bucket.file(name).exists())[0]
}

export async function makePublic(name: string): Promise<void> {
  if (!config.gc.useEmulator && (await exists(name))) await bucket.file(name).makePublic()
}

export async function makePrivate(name: string): Promise<void> {
  if (!config.gc.useEmulator && (await exists(name))) await bucket.file(name).makePrivate()
}

export async function remove(name: string): Promise<void> {
  const exists = (await bucket.file(name).exists())[0]
  if (exists) {
    await bucket.file(name).delete()
  }
}

export function createUrl(name: string): string {
  const url = `https://storage.googleapis.com/${bucket.name}/${name}`
  if (config.gc.useEmulator) {
    return url.replace('https://storage.googleapis.com', config.gc.apiEndpoint)
  }
  return url
}

export async function createSignedUrl(name: string, hours?: number): Promise<string> {
  const file = bucket.file(name)
  const [url] = await file.getSignedUrl({
    version: 'v4',
    action: 'read',
    expires: moment()
      .add(hours || 24, 'hours')
      .toDate(),
  })
  if (config.gc.useEmulator) {
    return url.replace('https://storage.googleapis.com', config.gc.apiEndpoint)
  }
  return url
}

export function normalizeUrl(url: string): string {
  if (config.gc.useEmulator) {
    return url.replace(`${config.gc.apiEndpoint}/${bucket.name}/`, '')
  }
  return url.replace(`https://storage.googleapis.com/${bucket.name}/`, '')
}

export default {
  saveImage,
  uploadFile,
  makePrivate,
  makePublic,
  remove,
  exists,
  createUrl,
  createSignedUrl,
  normalizeUrl,
}
