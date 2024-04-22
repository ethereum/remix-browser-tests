import connect from 'connect';
var proxy = require('express-http-proxy');
const { createProxyMiddleware } = require('http-proxy-middleware');

export const ipfsPlugin = () => {
    const app = connect() 
    
    app.use('/ipfs', proxy('https://ipfs-cluster.ethdevops.io', {
        proxyReqPathResolver: (req: any) => {
		console.log(req.url)
            return new Promise((resolve, reject) => resolve('/ipfs' + req.url));
          }
    }))
    
    return app
}
