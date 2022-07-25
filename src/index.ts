import './alias'
import './seeders'
import { connect } from '@/config/connect'
import Application from '@/app'

const application = new Application()

// connect to db and run application
application.listen()
connect()
