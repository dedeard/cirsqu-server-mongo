import Role from '@/models/role.model'
import logger from '@/config/logger'

export default async function roleSeeder() {
  let superRole = await Role.findOne({ name: 'Super Admin' })
  if (!superRole) {
    superRole = await Role.create({ name: 'Super Admin' })
    logger.info(`[ROLE SEEDER] Created role "${superRole.name}"`)
  }
}
