import roleSeeder from './role.seeder'
import userSeeder from './user.seeder'
import priceSeeder from './price.seeder'
import algoliaSeeder from './algolia.seeder'

const seed = async () => {
  await roleSeeder()
  await userSeeder()
  await priceSeeder()
  await algoliaSeeder()
}

seed()
