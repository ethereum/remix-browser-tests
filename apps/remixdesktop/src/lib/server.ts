import * as http from 'http'
import { WebSocketServer, WebSocket } from 'ws'
import EventEmitter from 'events'
import { RequestArguments } from '../types'
import path from 'path'
import express from 'express'
import cbor from 'cbor'

import { findAvailablePort } from '../utils/portFinder'
import { isPackaged } from '../main'
import { isE2ELocal } from '../main'
import JSONbig from 'json-bigint'

// Forwarding WebSocket client
let connectedWebSocket: WebSocket | null = null

// Handle incoming JSON-RPC requests and forward to WebSocket client
export const handleRequest = async (jsonRpcPayload: RequestArguments, eventEmitter: EventEmitter): Promise<any> => {
  if (!connectedWebSocket || connectedWebSocket.readyState !== WebSocket.OPEN) {
    throw new Error('No active WebSocket connection to forward request')
  }

  // Send the payload to the WebSocket client and wait for response
  return new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('Timeout waiting for WebSocket response')), 240000) // 10 seconds timeout

    connectedWebSocket &&
      connectedWebSocket.once('message', async (data: any) => {
        if (Buffer.isBuffer(data)) {
            data = data.toString('utf-8');
        }

        //console.log('received message from WebSocket ONCE client:', data);

        clearTimeout(timeout)
        try {
          //console.log('received message from WebSocket ONCE client:', data)
          const response = parseWithBigInt(data)
          //console.log('received message from WebSocket ONCE client:', response)
          if (response.id === jsonRpcPayload.id) {
            if (jsonRpcPayload.method === 'eth_sendTransaction' || jsonRpcPayload.method === 'eth_getTransactionReceipt') {
              console.log('response from WebSocket client:', data, response)
              eventEmitter.emit('focus')
            }
            if (response.error) {
              const error = { data: response.error }
              if (error.data && error.data.originalError && error.data.originalError.data) {
                resolve({
                  jsonrpc: '2.0',
                  error: error.data.originalError,
                  id: response.id,
                })
              } else if (error.data && error.data.message) {
                resolve({
                  jsonrpc: '2.0',
                  error: error.data && error.data,
                  id: response.id,
                })
              } else {
                resolve({
                  jsonrpc: '2.0',
                  error,
                  id: response.id,
                })
              }
            } else {
              if (jsonRpcPayload.method === 'eth_sendTransaction' || jsonRpcPayload.method === 'eth_getTransactionReceipt') {
                //console.log('resolve response from WebSocket client:', jsonRpcPayload.method, response)
                //     if(jsonRpcPayload.method === 'eth_getTransactionReceipt'){
                //         response.result = JSON.parse(response.result)
                //     }
              }
              resolve(response.result)
            }
          } else {
            //console.log('ignore response from WebSocket client:', data)
            //reject(new Error('Invalid response ID'));
          }
        } catch (error) {
          //console.log('REJECT error response from WebSocket client:', error)
          reject(error)
        }
      })

    connectedWebSocket &&
      connectedWebSocket.send(JSON.stringify(jsonRpcPayload), (err) => {
        if (jsonRpcPayload.method === 'eth_sendTransaction' || jsonRpcPayload.method === 'eth_getTransactionReceipt') {
          console.log('sent message to WebSocket client:', jsonRpcPayload)
        }
        if (err) {
          clearTimeout(timeout)
          reject(err)
        }
      })
  })
}

export const startHostServer = async (eventEmitter: EventEmitter) => {
  let http_port = await findAvailablePort([49589])
  const websocket_port = await findAvailablePort([49588])
  // Create an Express server
  const startServer = () => {
    const server = express()

    // Serve static files from the 'remix-ide' directory
    const remixPath = path.join(__dirname, 'remix-ide')
    server.use(express.static(remixPath))

    console.log('remixPath', remixPath)

    // Serve 'index.html' at the root route
    server.get('/', (req, res) => {
      res.sendFile(path.join(remixPath, 'index.html'))
    })

    // Start the server
    const httpServer = http.createServer(server)
    httpServer.listen(http_port, () => {
      const address = httpServer.address()
      if (typeof address === 'string') {
        console.log(`Server started at ${address}`)
      } else if (address && address.port) {
        console.log(`Server started at http://localhost:${address.port}`)
      } else {
      }
    })

    return httpServer
  }
  // Create the WebSocket server
  const wsServer = new WebSocketServer({ port: websocket_port })

  wsServer.on('connection', (ws) => {
    console.log('WebSocket client connected')
    if (connectedWebSocket?.OPEN) {
      ws.send(JSON.stringify({ type: 'error', payload: 'ALREADY_CONNECTED' }))
      ws.close(1000, 'Another client connected')
      return
      //console.log(connectedWebSocket.url)
    } else {
      try {
        connectedWebSocket.removeAllListeners()
      } catch (e) {}
    }

    connectedWebSocket = ws
    eventEmitter.emit('connected', true)

    connectedWebSocket.on('message', (data: any) => {
      if (Buffer.isBuffer(data)) {
           data = data.toString('utf-8');
      }
      const response = parseWithBigInt(data)
      if (response && response.type) {
        //console.log('received message from WebSocket client:', response)
        eventEmitter.emit(response.type, response.payload)
      }
    })

    connectedWebSocket.on('close', () => {
      //console.log('WebSocket client disconnected');
      connectedWebSocket = null
      eventEmitter.emit('connected', false)
    })

    connectedWebSocket.on('error', (error) => {
      //console.error('WebSocket error:', error.message);
      connectedWebSocket = null
      eventEmitter.emit('connected', false)
    })
  })

  console.log(`WebSocket server running on ws://localhost:` + JSON.stringify((wsServer.address() as any).port))
  if ((process.env.NODE_ENV === 'production' || isPackaged) && !isE2ELocal) {
    startServer()
  } else {
    http_port = 8080
  }

  return {
    http_port,
    websocket_port,
  }
}

function parseWithBigInt(json) {
  const result = JSON.parse(json, (key, value) => {
    if (typeof value === 'string' && /^\d+n?$/.test(value)) {
      return BigInt(value.endsWith('n') ? value.slice(0, -1) : value)
    }
    return value
  })
  return result
  try {
    return cbor.decode(json)
  } catch (e) {
    console.log('parseWithBigInt error', e, json)
    console.log('parseWithBigInt error', e)
    return {}
  }
  console.log('parseWithBigInt', json)
  return JSON.parse(json, (key, value) => (typeof value === 'string' && /^\d+n?$/.test(value) ? BigInt(value) : value))
}
