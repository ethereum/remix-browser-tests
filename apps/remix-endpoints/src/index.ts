import './LoadEnv' // Must be the first import
import https from 'https'
import fs from 'fs'
import app from './Server'
import logger from './shared/Logger'
import vhost from 'vhost'
import { embedly } from './hosts/embedly'
import { ipfsPlugin } from './hosts/ipfs-plugin'
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


import hostile from 'hostile'
async function setHostsEntry(url: string) {
    try {
        await new Promise<void>((resolve, reject) => {
            hostile.set('127.0.0.1', url, (err: any) => {
                if (err) {
                    reject(err);
                } else {
                    console.log('set /etc/hosts successfully!', url);
                    resolve();
                }
            });
        });
    } catch (err) {
        console.error(err);
    }
}

(async () => {
    await setHostsEntry('jqgt.remixproject.org')

    // log using winston
    app.use(morgan('common', {
        stream: fs.createWriteStream('./access.log', { flags: 'a' })
    }));
    app.use(morgan('dev'));


    // app.use(vhost('*', remixProject()));
    app.use(vhost('remixproject.org', remixProject()))
    app.use(vhost('www.remixproject.org', remixProject()))
    app.use(vhost('embedly.remixproject.org', embedly()))
    app.use(vhost('jqgt.remixproject.org', ipfsGatewayPlugin()))
    app.use(vhost('corsproxy.remixproject.org', corsProxy()))
    app.use(vhost('vyper.remixproject.org', vyperProxy()))
    app.use(vhost('vyper2.remixproject.org', vyper2Proxy()))
    app.use(vhost('rss.remixproject.org', RSS()))
    app.use(vhost('status.remixproject.org', StatusPlugin()))
    app.use(vhost('openai-gpt.remixproject.org', openaigpt()))
    app.use(vhost('solcoder.remixproject.org', solcoder()))
    app.use(vhost('gpt-chat.remixproject.org', gptchat()))
    app.use(vhost('completion.remixproject.org', solcompletion()))

    // Start the server
    const port = Number(80);
    app.listen(port, () => {
        logger.info('Express server started on port: ' + port);
    });

    if (process.env.SSL_KEY && process.env.SSL_CERT) {

        try {
            const httpsServer = https.createServer({
                key: fs.readFileSync(process.env.SSL_KEY),
                cert: fs.readFileSync(process.env.SSL_CERT),
            }, app);

            httpsServer.listen(443, () => {
                logger.info('HTTPS Server running on port 443');
            });
        } catch (e) {
            console.warn(e)
        }

    } else {
        console.error('No SSL key found, not starting HTTPS server');
        process.exit(1)
    }

})()
