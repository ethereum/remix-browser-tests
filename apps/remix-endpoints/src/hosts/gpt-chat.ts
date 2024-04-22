import connect from 'connect'
import { responseInterceptor } from 'http-proxy-middleware'
const { createProxyMiddleware } = require('http-proxy-middleware')

export const gptchat = () => {
    const app = connect()
    app.use('/', createProxyMiddleware({
        target: 'http://localhost:9080/',
        changeOrigin: true,
        selfHandleResponse: true,
        onProxyReq(proxyReq:any, req: any, res: any) {
            proxyReq.setHeader('content-length', JSON.stringify(req.body).length);
            proxyReq.setHeader('content-type', 'application/json');
            // Write out body changes to the proxyReq stream
            proxyReq.write(JSON.stringify(req.body));
            proxyReq.end();
        },
        onProxyRes: responseInterceptor(async (responseBuffer, proxyRes, req, res) => {
            // set the header so the browser doesn't complain
            res.setHeader('Access-Control-Allow-Origin', '*')
            return responseBuffer.toString('utf8')
        })
    }))
    return app
}
