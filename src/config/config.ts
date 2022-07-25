import path from 'path'
import dotenv from 'dotenv'

dotenv.config({ path: path.join(__dirname, '../../.env') })

const config = {
  isProd: process.env.NODE_ENV === 'production',
  isDev: process.env.NODE_ENV === 'development',

  port: Number(process.env.PORT || 5000),
  mongodbUrl: process.env.MONGODB_URL || 'mongodb://localhost:27017/cirsqu',
  resetPasswordExpMinutes: Number(process.env.RESET_PASSWORD_EXP_MINUTES || 15),
  activityLength: Number(process.env.ACTIVITY_LENGTH || 20),
  logging: process.env.LOGGING === 'true',
  uploadDir: path.join(__dirname, '../../', process.env.UPLOAD_DIR || 'uploads'),
  maxVideoSize: Number(process.env.MAX_VIDEO_SIZE || 100),
  cacheTtl: Number(process.env.CACHE_TTL || 60),

  redis: {
    host: String(process.env.REDIS_HOST || 'localhost'),
    port: Number(process.env.REDIS_PORT || 6379),
    pass: String(process.env.REDIS_PASS || ''),
  },

  algolia: {
    appId: String(process.env.ALGOLIA_APP_ID),
    apiKey: String(process.env.ALGOLIA_API_KEY),
  },

  gc: {
    useEmulator: process.env.GC_USE_EMULATOR === 'true',
    apiEndpoint: process.env.GC_API_ENDPOINT || 'http://localhost:2100',
    bucketName: process.env.GC_BUCKET_NAME || 'cirsqu',
    key: {
      project_id: process.env.GC_PROJECT_ID || '',
      private_key: String(process.env.GC_PRIVATE_KEY || '').replace(/\\n/g, '\n'),
      client_email: process.env.GC_CLIENT_EMAIL || '',
    },
  },

  superAdmin: {
    name: process.env.SUPER_ADMIN_NAME || 'Super Admin',
    email: process.env.SUPER_ADMIN_EMAIL || 'super@admin.com',
    password: process.env.SUPER_ADMIN_PASSWORD || 'superadmin',
  },

  jwt: {
    secret: String(process.env.JWT_SECRET || 'secret'),
    expDays: Number(process.env.JWT_EXP_DAYS || 30),
  },

  pusher: {
    appId: String(process.env.PUSHER_APP_ID),
    key: String(process.env.PUSHER_APP_KEY),
    secret: String(process.env.PUSHER_APP_SECRET),
    cluster: String(process.env.PUSHER_APP_CLUSTER),
    disableStats: true,
  },

  smtp: {
    host: String(process.env.SMTP_HOST),
    port: Number(process.env.SMTP_PORT),
    auth: {
      user: String(process.env.SMTP_USER),
      pass: String(process.env.SMTP_PASS),
    },
    from: `"${process.env.SMTP_FROM_NAME}" <${process.env.SMTP_FROM_MAIL}>`,
  },

  midtrans: {
    id: String(process.env.MIDTRANS_ID),
    clientKey: String(process.env.MIDTRANS_CLIENT_KEY),
    serverKey: String(process.env.MIDTRANS_SERVER_KEY),
  },
}

export default config
