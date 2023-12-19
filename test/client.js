import config from './esconfig.js';
import { Spark } from '../es/index.mjs';
import WebSocket, { WebSocketServer } from 'ws';
const wss = new WebSocket('ws://localhost:3000')
const server = new WebSocketServer({ port: 3000 })
wss.on('open', () => {
  console.log('链接服务器')
  wss.send('孙悟空大闹天宫!!')
})
// 监听消息事件
wss.on('message', (message) => {
  console.log('收到服务器消息:', message);
});
// 监听消息事件
wss.on('close', (message) => {
  console.log('与服务器的连接已断开');
});
server.on('connection', (client) => {
  client.on('message', async (e) => {
    const char = new Spark(config)
    const res = await char.send('你是谁')
    console.log('返回结果: ', res)
  })
})