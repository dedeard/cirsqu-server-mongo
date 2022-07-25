import User from '@/models/user.model'
import Role from '@/models/role.model'
import config from '@/config/config'
import logger from '@/config/logger'

export default async function userSeeder() {
  let superRole = await Role.findOne({ name: 'Super Admin' })
  if (superRole) {
    await User.updateMany({ role: superRole.id }, { role: null })

    let superUser = await User.findOne({ email: config.superAdmin.email })

    if (!superUser) {
      superUser = await User.create({ ...config.superAdmin, role: superRole.id })
      logger.info(`[USER SEEDER] Created Super user`)
    } else {
      superUser.role = superRole.id
      superUser.name = config.superAdmin.name
      superUser.password = config.superAdmin.password
      await superUser.save()
      logger.info(`[USER SEEDER] Updated Super user`)
    }
  }
}
