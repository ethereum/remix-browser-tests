import connect from 'connect';
import serveStatic = require('serve-static');

export const remixProject = () => {
    const app = connect()
    app.use('/.well-known', serveStatic('public/.well-known') as connect.HandleFunction)
    app.use('/', (req: any, res: any, next: any) => {
        res.redirect('https://remix-project.org')
    })
    
    return app
}
