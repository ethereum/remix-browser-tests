import './LoadEnv' // Must be the first import
import https from 'https'
import fs from 'fs'
import app from './Server'
import logger from './shared/Logger'
import vhost from 'vhost'
import { embedly } from './hosts/embedly'
import { remixProject } from './hosts/remix-project'
import { ipfsGatewayPlugin } from './hosts/ipfs-gateway-plugins'
import { corsProxy } from './hosts/corsproxy'
import { vyperProxy } from './hosts/vyperproxy'
import { vyper2Proxy } from './hosts/vyper2'
import { openaigpt } from './hosts/openai-gpt'
import { solcoder } from './hosts/solcoder'
import { solcompletion } from './hosts/sol-completion'
import { gptchat } from './hosts/gpt-chat'
import { RSS } from './hosts/rss';
import morgan from 'morgan';
import { StatusPlugin } from './hosts/status'
import { mockChat } from './hosts/mock-ai-gpt'

(async () => {

    // log using winston
    app.use(morgan('common', {
        stream: fs.createWriteStream('./access.log', { flags: 'a' })
    }));
    app.use(morgan('dev'));

    
    let port: number
    let ssl_port: number
    if(process.env.NODE_ENV === 'test') {
        port = Number(1024);
        ssl_port = Number(1025);
        console.log('Starting dev server...')
        app.use('/jqgt', ipfsGatewayPlugin());
        app.use('/openai-gpt', openaigpt());
        app.use('/solcoder', solcoder());
        app.use('/completion', solcompletion());
        app.use('/gpt-chat', gptchat());
        app.use('/chat/completions', mockChat());
    }else{
        port = Number(80);
        ssl_port = Number(443);
        app.use(vhost('jqgt.remixproject.org', ipfsGatewayPlugin()))
        app.use(vhost('openai-gpt.remixproject.org', openaigpt()))
        app.use(vhost('solcoder.remixproject.org', solcoder()))
        app.use(vhost('completion.remixproject.org', solcompletion()))
        app.use(vhost('gpt-chat.remixproject.org', gptchat()))
    }

    app.use(vhost('remixproject.org', remixProject()))
    app.use(vhost('www.remixproject.org', remixProject()))
    app.use(vhost('embedly.remixproject.org', embedly()))
    app.use(vhost('corsproxy.remixproject.org', corsProxy()))
    app.use(vhost('vyper.remixproject.org', vyperProxy()))
    app.use(vhost('vyper2.remixproject.org', vyper2Proxy()))
    app.use(vhost('rss.remixproject.org', RSS()))
    app.use(vhost('status.remixproject.org', StatusPlugin()))
    
    // Start the server
   
    app.listen(port,  'localhost', () => {
        logger.info('Express server started on port: ' + port);
    });

    if (process.env.SSL_KEY && process.env.SSL_CERT) {

        try {
            const httpsServer = https.createServer({
                key: fs.readFileSync(process.env.SSL_KEY),
                cert: fs.readFileSync(process.env.SSL_CERT),
            }, app);

            httpsServer.listen(ssl_port, 'localhost', () => {
                logger.info(`HTTPS Server running on port ${ssl_port} `);
            });
        } catch (e) {
            console.warn(e)
        }

    } else {
        console.error('No SSL key found, not starting HTTPS server');
        process.exit(1)
    }

})()
