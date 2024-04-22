import express, { Request } from 'express';
import cors from 'cors'
import axio from 'axios'

export const solcoder = () => {
  const app = express()
  const ips = new Map<string, number>()
  app.use(cors())
  app.post('/', async (req: any, res: any, next: any) => {
    if (ips.get(req.ip) && (Date.now() - (ips.get(req.ip) as number)) < 10000) { // 1 call every 10 seconds
      res.setHeader('Content-Type', 'application/json');
      const remainer = 10000 - (Date.now() - (ips.get(req.ip) as number))
      res.end(JSON.stringify({ error: `rate limit exceeded, please wait ${remainer} ms` }));
      next()
      return
    }
    ips.set(req.ip, Date.now())

    const prompt = req.body.data[0]
    const task = req.body.data[1]
    const params = req.body.data.slice(2, req.body.data.length)
    const result = await axio.post( "https://7dixmojk6ir0ot-7861.proxy.runpod.net/ai/api/".concat(task),
      {"data":[prompt, ...params]}
    )


    const response = result.data
    res.setHeader('Content-Type', 'application/json');
    res.end(JSON.stringify(response));
    next()
  })
  return app
}
