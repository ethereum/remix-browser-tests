import connect from 'connect';
const { createProxyMiddleware } = require('http-proxy-middleware');

export const corsProxy = () => {
    const app = connect()
    app.use('/', createProxyMiddleware({ target: 'http://localhost:9999/', changeOrigin: true }));
    return app
}