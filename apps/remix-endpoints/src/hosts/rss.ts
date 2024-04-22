import connect from 'connect';
import fs from 'fs'
var cors = require('cors')

export const RSS = () => {
    const app = connect()
    app.use(cors())
    app.use('/', (req: any, res: any, next: any) => {
        res.setHeader('Content-Type', 'application/rss+xml');
        const xml = fs.readFileSync('/tmp/remix-ide-rss')
        res.end(xml)
    })
    
    return app
}
