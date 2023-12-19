import { WebSocket } from 'ws';
class Socket {
  onmessage=  () => {}
  onerror=  () => {}
  onopen= () => {}
  onclose=  () => {}
  static socket
  constructor(url) {
    this.socket = new WebSocket(url)
    this.socket.on('error', (e) => {
      console.log(e, 'eeee')
      this.onerror(e)
    })
    this.socket.on('close', (e) => {
      this.onclose(e)
    })
    this.socket.on('open', (e) => {
      this.onopen(e)
    })
    this.socket.on('message', e => {
      this.onmessage({
        data: e.toString('utf-8')
      })
    })
  }
  send(data) {
    this.socket.send(data)
  }
  close() {
    this.socket.close()
  }
}

export { Socket };