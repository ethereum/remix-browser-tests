import connect from 'connect';
import serveStatic = require('serve-static');

export const embedly = () => {
    const app = connect()
    // this handled the certbot certificate verification for *all* the sub domains
    app.use('/.well-known', serveStatic('public/.well-known') as connect.HandleFunction)
    app.use('/', (req: any, res: any, next: any) => {
        let baseUrl = 'https://remix.ethereum.org?'
        const gist = req.query.gist
        if (gist) baseUrl = `${baseUrl}minimizeterminal=true&gist=${gist}`
        else baseUrl = `${baseUrl}&embed=true`

        baseUrl = `${baseUrl}&plugins=solidity,udapp`
        if (gist) baseUrl = `${baseUrl},fileExplorer`
        
        res.setHeader('Content-Type', 'application/json');
        res.end(JSON.stringify({
            "version": "1.0",
            "type": "rich",
        
            "provider_name": "remix",
            "provider_url": "https://remix.ethereum.org",
        
            "author_name": "Remix team",
            "author_url": "https://remix-project.org",
        
            "html": "<iframe src=\"" + baseUrl + "\" width=\"700\" height=\"825\" scrolling=\"yes\" frameborder=\"0\" allowfullscreen></iframe>",
            "width": 700,
            "height": 825,
        
            "thumbnail_url": "https://remix.ethereum.org/assets/img/hexagon-remix-greengrey-texture.png",
            "thumbnail_width": 280,
            "thumbnail_height": 175,
        
            "referrer": "https://remix.ethereum.org",
            "cache_age": 3600,        
        }));
        next()
    })
    return app
}
