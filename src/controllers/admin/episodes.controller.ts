import path from 'path'
import Joi from 'joi'
import fs from 'fs-extra'
import moment from 'moment'
import crypto from 'crypto'
import { Types } from 'mongoose'
import { fromBuffer } from 'file-type'
import { UploadedFile } from 'express-fileupload'
import getVideoDurationInSeconds from 'get-video-duration'
import ApiError from '@/shared/ApiError'
import ca from '@/shared/catchAsync'
import Episode, { IEpisodeDocument } from '@/models/episode.model'
import config from '@/config/config'
import Lesson from '@/models/lesson.model'
import uploadEpisodeToStorageQueue from '@/queue/uploadEpisodeToStorageQueue'
import storageService from '@/services/storage.service'

export const getEpisodeUrl = ca(async (req, res) => {
  const episodeId = req.params.episodeId
  if (!Types.ObjectId.isValid(episodeId)) throw new ApiError(400, 'Episode id is invalid.')
  const episode = await Episode.findById(episodeId)
  if (!episode) throw new ApiError(404, 'Episode not found.')
  let url: string
  if (episode.pro) {
    url = await storageService.createSignedUrl(episode.name)
  } else {
    url = storageService.createUrl(episode.name)
  }
  res.json({ url })
})

export const createEpisode = ca(async (req, res) => {
  const lessonId = req.params.lessonId
  if (!Types.ObjectId.isValid(lessonId)) throw new ApiError(400, 'LessonId is invalid.')
  const lesson = await Lesson.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Lesson not found.')

  const video = req.files?.video
  const data: UploadedFile | undefined = Array.isArray(video) ? video[0] : video

  if (!data) throw new ApiError(422, 'Video is required')

  const mime = await fromBuffer(data.data)
  if (!['mp4'].includes(mime?.ext || '')) {
    throw new ApiError(422, 'Video format must be [mp4]')
  }
  if (data.size > config.maxVideoSize * 1024 * 1024) throw new ApiError(422, 'Video size must be less than ' + config.maxVideoSize + 'MB')

  await fs.ensureDir(path.join(config.uploadDir, 'episodes'))
  const name = 'episodes/' + crypto.randomBytes(5).toString('hex') + moment().unix() + '.' + mime?.ext
  await data.mv(path.join(config.uploadDir, name))

  const episode = await Episode.create({
    name,
    title: path.parse(data.name).name,
    seconds: Math.round(await getVideoDurationInSeconds(path.join(config.uploadDir, name))),
    pro: true,
  })

  lesson.episodes.push(episode)
  await lesson.save()

  await uploadEpisodeToStorageQueue.createJob({ name }).save()
  res.json(lesson)
})

export const updateEpisode = ca(async (req, res) => {
  const lessonId = req.params.lessonId
  const episodeId = req.params.episodeId
  if (!Types.ObjectId.isValid(lessonId)) throw new ApiError(400, 'Lesson id is invalid.')
  if (!Types.ObjectId.isValid(episodeId)) throw new ApiError(400, 'Episode id is invalid.')
  const lesson = await Lesson.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Lesson not found.')
  const episode = lesson.episodes.find((el) => el.id === episodeId)
  if (!episode) throw new ApiError(404, 'Episode not found.')

  let { title, pro, file } = req.body
  try {
    const validated = await Joi.object({
      title: Joi.string().trim().min(3).max(100).required(),
      pro: Joi.boolean().required(),
      file: Joi.string().trim().uri().allow('').required(),
    }).validateAsync({ title, pro, file }, { abortEarly: false })
    title = validated.title
    pro = validated.pro
    file = validated.file
  } catch (err) {
    throw new ApiError(422, 'Failed to update episode.', err)
  }

  if (pro) {
    await storageService.makePrivate(episode.name)
  } else {
    await storageService.makePublic(episode.name)
  }

  episode.title = title
  episode.pro = pro
  episode.file = file

  await episode.save()

  lesson.episodes.map((el) => {
    if (el.id === episodeId) {
      return episode
    }
    return el
  })

  await lesson.save()

  res.json(lesson)
})

export const deleteEpisode = ca(async (req, res) => {
  const lessonId = req.params.lessonId
  const episodeId = req.params.episodeId
  if (!Types.ObjectId.isValid(lessonId)) throw new ApiError(400, 'Lesson id is invalid.')
  if (!Types.ObjectId.isValid(episodeId)) throw new ApiError(400, 'Episode id is invalid.')
  const lesson = await Lesson.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Lesson not found.')
  const episode = lesson.episodes.find((el) => el.id === episodeId)
  if (!episode) throw new ApiError(404, 'Episode not found.')

  await episode.delete()
  lesson.episodes = lesson.episodes.filter((el) => el.id !== episodeId)
  await lesson.save()
  await fs.remove(path.join(config.uploadDir, episode.name))
  await storageService.remove(episode.name)
  res.json(lesson)
})

export const updateEpisodeIndex = ca(async (req, res) => {
  const lessonId = req.params.lessonId
  if (!Types.ObjectId.isValid(lessonId)) throw new ApiError(404, 'Lesson id is invalid.')
  const lesson = await Lesson.findById(lessonId)
  if (!lesson) throw new ApiError(404, 'Lesson not found.')

  const { error, value } = Joi.array().items(Joi.string().trim()).required().validate(req.body.index)
  if (error) throw new ApiError(422, 'Index must be valid array<string>')

  const index = value
    .filter((el: any) => Types.ObjectId.isValid(el))
    .filter((value: string, index: number, self: any) => self.indexOf(value) === index)

  const episodes: IEpisodeDocument[] = []
  index.forEach((id: string) => {
    const episode = lesson.episodes.find((el) => el.id === id)
    if (episode) episodes.push(episode)
  })

  if (episodes.length !== lesson.episodes.length) throw new ApiError(422, 'Index is invalid.')

  lesson.episodes = episodes
  await lesson.save()

  res.json(lesson)
})
