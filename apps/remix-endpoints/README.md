# REMIX ENDPOINTS
This exposes our server endpoints partially as a localhost server on CI allowing changes to the endpoints to be tested.

The general chat API has been mocked with a static response in order to not spam the API_KEY on CI.

These endpoints have been set locally:

```
        app.use('/jqgt', ipfsGatewayPlugin());
        app.use('/openai-gpt', openaigpt());
        app.use('/solcoder', solcoder());
        app.use('/completion', solcompletion());
        app.use('/gpt-chat', gptchat());
        app.use('/chat/completions', mockChat());
```
The others will go to the production server, like Vyper and so on.

To run locally:
- yarn && yarn start:test
- NX_API_URL=http://localhost:1024/ yarn serve

This starts a local test server allowing connection and serves the app with the local API URL



