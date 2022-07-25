const http = require('http')
const Queue = require('bee-queue')
const dotenv = require('dotenv')

dotenv.config()

const queue = new Queue('midtrans-notification', {
  redis: {
    host: process.env.NOTIFICATION_REDIS_HOST,
    port: Number(process.env.NOTIFICATION_REDIS_PORT),
    auth_pass: process.env.NOTIFICATION_REDIS_PASS,
  },
})

queue.process((job, done) => {
  const data = JSON.stringify(job.data)
  const options = {
    hostname: 'localhost',
    port: process.env.PORT,
    path: '/orders/notification/handling',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': data.length,
    },
  }

  const req = http.request(options, (res) => {
    console.log(`statusCode: ${res.statusCode}`)
    done()
    res.on('data', (d) => {
      process.stdout.write(d)
    })
  })

  req.on('error', (error) => {
    console.error(error)
    done()
  })

  req.write(data)
  req.end()
})
