import logger from '@/config/logger'
import Category from '@/models/category.model'
import Lesson from '@/models/lesson.model'

export default async function algoliaSeeder() {
  await Lesson.reindexAlgolia()
  logger.info(`[ALGOLIA SEEDER] Reindex lessons`)
  await Category.reindexAlgolia()
  logger.info(`[ALGOLIA SEEDER] Reindex categories`)
}
