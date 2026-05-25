// Flipper Zero proprietary BLE serial service (not Nordic UART Service)
// Source: Flipper-Android-App FlipperZeroBleBuilderConfig.kt
const SERIAL_SERVICE  = '8fe5b3d5-2e7f-4a98-2a48-7acc60fe0000'
const CHAR_RX         = '19ed82ae-ed21-4c9d-4145-228e61fe0000' // Flipper→phone (notify)
const CHAR_TX         = '19ed82ae-ed21-4c9d-4145-228e62fe0000' // phone→Flipper (write)
const CHAR_OVERFLOW   = '19ed82ae-ed21-4c9d-4145-228e63fe0000' // remaining buffer (notify)
const CHAR_RESET      = '19ed82ae-ed21-4c9d-4145-228e64fe0000' // write 0x00 to restart RPC

// Android app requests MTU 512; effective payload = MTU - 3 ATT bytes
const MAX_MTU = 512

export class BluetoothTransport {
  constructor () {
    this.onmessage = null
    this._device       = null
    this._server       = null
    this._rxChar       = null  // flipper→phone, we subscribe
    this._txChar       = null  // phone→flipper, we write
    this._overflowChar = null  // remaining buffer counter
    this._resetChar    = null
    this._mtu          = 20    // updated after negotiation
    this._readMode     = null
    this._readBuffer   = new Uint8Array(0)
    this._writeQueue   = []
    this._writerIdle   = true
    // Overflow throttle: how many bytes the Flipper can still accept
    this._remainingBuffer = 0
    this._bufferResolvers = []
  }

  postMessage ({ operation, data }) {
    switch (operation) {
      case 'connect':      this._connect(data);   break
      case 'disconnect':   this._disconnect();     break
      case 'read':         this._startRead(data);  break
      case 'stop reading': this._stopRead();       break
      case 'write':        this._enqueue(data);    break
    }
  }

  _emit (data) {
    if (this.onmessage) this.onmessage({ data })
  }

  async _connect (device) {
    try {
      this._device = device

      this._device.addEventListener('gattserverdisconnected', () => {
        this._emit({ operation: 'disconnect', status: 1 })
      })

      this._server = await this._device.gatt.connect()
      const service = await this._server.getPrimaryService(SERIAL_SERVICE)
      this._rxChar = await service.getCharacteristic(CHAR_RX)
      this._txChar = await service.getCharacteristic(CHAR_TX)

      if (this._txChar.maximumValueSize != null) {
        this._mtu = this._txChar.maximumValueSize + 3
      }

      try {
        this._overflowChar = await service.getCharacteristic(CHAR_OVERFLOW)
        const initial = await this._overflowChar.readValue()
        this._updateOverflow(initial)
        await this._overflowChar.startNotifications()
        this._overflowChar.addEventListener('characteristicvaluechanged', (e) => {
          this._updateOverflow(e.target.value)
        })
      } catch {
        this._overflowChar = null
        this._remainingBuffer = Infinity
      }

      try {
        this._resetChar = await service.getCharacteristic(CHAR_RESET)
      } catch {
        this._resetChar = null
      }

      await this._rxChar.startNotifications()
      this._rxChar.addEventListener('characteristicvaluechanged', (e) => {
        this._onData(new Uint8Array(e.target.value.buffer))
      })

      this._emit({ operation: 'connect', status: 1 })
    } catch (error) {
      this._emit({ operation: 'connect', status: 0, error })
    }
  }

  _updateOverflow (dataView) {
    if (!dataView || dataView.byteLength < 4) return
    const remaining = dataView.getInt32(0, false)
    this._remainingBuffer = remaining
    const resolvers = this._bufferResolvers.splice(0)
    resolvers.forEach(r => r())
  }

  _waitForBuffer () {
    if (this._remainingBuffer > 0 || this._overflowChar === null) return Promise.resolve()
    return new Promise(resolve => this._bufferResolvers.push(resolve))
  }

  _onData (chunk) {
    if (this._readMode) {
      this._emit({ operation: this._readMode + ' output', data: chunk })
      return
    }

    const newBuffer = new Uint8Array(this._readBuffer.length + chunk.length)
    newBuffer.set(this._readBuffer)
    newBuffer.set(chunk, this._readBuffer.length)
    this._readBuffer = newBuffer

    const tail = new TextDecoder().decode(this._readBuffer.slice(-12)).replace(/\s/g, '')
    if (tail.endsWith('>:\x07')) {
      const buf = this._readBuffer
      this._readBuffer = new Uint8Array(0)
      this._emit({ operation: 'read', data: 'read', status: 1 })
      this._emit({ operation: 'read', status: 1, data: buf })
    }
  }

  _startRead (mode) {
    this._readMode   = mode || null
    this._readBuffer = new Uint8Array(0)
  }

  _stopRead () {
    this._readMode = null
  }

  _disconnect () {
    if (this._device?.gatt?.connected) {
      this._device.gatt.disconnect()
    }
    this._emit({ operation: 'disconnect', status: 1 })
  }

  _enqueue (entry) {
    this._writeQueue.push(entry)
    if (this._writerIdle) this._write()
  }

  async _write () {
    this._writerIdle = false
    while (this._writeQueue.length) {
      const entry = this._writeQueue[0]
      try {
        let bytes
        if (entry.mode.startsWith('cli')) {
          const encoder = new TextEncoder()
          let text = entry.data.join('')
          if (entry.mode === 'cli/delimited') text += '\r\n'
          bytes = encoder.encode(text)
        } else if (entry.mode === 'raw') {
          bytes = new Uint8Array(entry.data[0].buffer)
        } else {
          throw new Error('Unknown write mode: ' + entry.mode)
        }

        const chunkSize = Math.max(20, this._mtu - 3)
        for (let i = 0; i < bytes.length; i += chunkSize) {
          const chunk = bytes.slice(i, i + chunkSize)
          if (this._overflowChar !== null) {
            await this._waitForBuffer()
            this._remainingBuffer -= chunk.length
          }
          await this._txChar.writeValueWithoutResponse(chunk)
        }

        this._writeQueue.shift()
        this._emit({ operation: 'write/end' })
        this._emit({ operation: 'write', status: 1 })
      } catch (error) {
        this._writeQueue.shift()
        this._emit({ operation: 'write', status: 0, error })
      }
    }
    this._writerIdle = true
  }
}
