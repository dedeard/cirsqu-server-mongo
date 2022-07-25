import logger from '@/config/logger'
import Price from '@/models/price.model'

const lists = [
  {
    name: 'Per Bulan',
    slug: 'per-bulan',
    details: ['Unlimited streaming of content', 'Download videos to take with you', 'Access to full source code and resources'],
    months: 1,
    price: '100000',
  },
  {
    name: 'Setengah Tahun',
    slug: 'setengah-tahun',
    details: [
      'Save 36% ($52) compared to monthly',
      'Unlimited streaming of content',
      'Download videos to take with you',
      'Access to full source code and resources',
    ],
    months: 6,
    price: '500000',
  },
  {
    name: 'Per Tahun',
    slug: 'per-tahun',
    details: [
      'Save 50% ($52) compared to monthly',
      'Unlimited streaming of content',
      'Download videos to take with you',
      'Access to full source code and resources',
    ],
    months: 12,
    price: '800000',
  },
]

export default async function priceSeeder() {
  for (let x in lists) {
    let pricelist = await Price.findOne({ months: lists[x].months })
    if (!pricelist) {
      await Price.create(lists[x])
      logger.info(`[PRICE SEEDER] Created price "${lists[x].slug}"`)
    }
  }
}
