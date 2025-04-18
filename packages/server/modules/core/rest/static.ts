import { packageRoot } from '@/bootstrap'
import * as express from 'express'
import * as path from 'path'

export default (app: express.Application) => {
  app.use('/static', express.static(path.join(packageRoot, 'assets', 'public')))
  app.use('/api/ping', (_, res) => {
    res.set('Content-Type', 'text/plain')
    res.send('pong')
  })
}
