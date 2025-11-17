import { EventEmitter } from 'events'
export class MyWebsocket extends EventEmitter {
  private socket: WebSocket | undefined = undefined
  private url: URL
  constructor(url) {
    super()
    this.url = url
  }
  get connected() {
    if (!this.socket) {
      return 0
    }
    return this.socket.OPEN
  }
  get connectting() {
    if (!this.socket) {
      return 0
    }
    return this.socket.CONNECTING
  }
  async connect() {
    if (this.socket) {
      return this
    }
    this.socket = new WebSocket(this.url)
    this.socket.binaryType = 'arraybuffer'
    this.socket.onmessage = (event) => {
      this.emit('message', event.data)
    }
    this.socket.onerror = this.emit.bind(this, 'error')
    this.socket.onopen = this.emit.bind(this, 'connected')
    this.socket.onclose = this.emit.bind(this, 'closed')
    return this
  }
  async disconnect(code, reason) {
    if (this.socket) {
      this.socket.close(code, reason)
      this.socket = undefined
    }
  }
  async send(buffer) {
    if (this.socket) {
      return this.socket.send(buffer)
    }
    return Promise.reject('socket hunup!')
  }
}
