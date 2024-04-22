import connect from 'connect';
const { createProxyMiddleware } = require('http-proxy-middleware');

var httpProxy = require('http-proxy');
var apiProxy = httpProxy.createProxyServer();

export const vyperProxy = () => {
    const app = connect()

    //app.use("/compile", function (req: any, res: any) {
    //    apiProxy.web(req, res, { target: 'http://localhost:9998/compile' })
    //});

    //app.use('/', createProxyMiddleware({ target: 'http://localhost:9998/', changeOrigin: true }));
    app.use('/compile', createProxyMiddleware({
        onProxyReq(proxyReq:any, req: any, res: any) {
            proxyReq.setHeader('content-length', JSON.stringify(req.body).length);
            proxyReq.setHeader('content-type', 'application/json');
            // Write out body changes to the proxyReq stream
            proxyReq.write(JSON.stringify(req.body));
            proxyReq.end();
        },
        target: 'http://localhost:9998/',
        changeOrigin: true
    }));
    return app
}