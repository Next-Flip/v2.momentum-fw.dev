import * as flipper from './core'
import { Operation } from './util'

const operation = new Operation()
const filters = [
  { usbVendorId: 0x0483, usbProductId: 0x5740 }
]

let serial = null

// Only create worker in browser environment
if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
  serial = new Worker(new URL('./workers/webSerial.js', import.meta.url))
  serial.onmessage = (e) => {
    if (e.data.operation === 'cli output') {
      flipper.emitter.emit('cli output', e.data.data)
    } else if (e.data.operation === 'raw output') {
      flipper.emitter.emit('raw output', e.data.data)
    } else if (e.data.operation === 'write/end') {
      flipper.emitter.emit('write/end')
    } else {
      operation.terminate(e.data)
    }
  }
  navigator.serial.addEventListener("disconnect", () => {
    flipper.emitter.emit('disconnect')
  })
}

async function connect () {
  if (!serial) {
    throw new Error('Serial worker not available (SSR environment)')
  }
  const ports = await navigator.serial.getPorts({ filters })
  if (ports.length === 0) {
    throw new Error('No known ports')
  }
  const connect = operation.create(serial, 'connect')
  await connect
}

async function disconnect () {
  if (!serial) {
    throw new Error('Serial worker not available (SSR environment)')
  }
  const disconnect = operation.create(serial, 'disconnect')
  await disconnect
}

async function write (mode, data) {
  if (!serial) {
    throw new Error('Serial worker not available (SSR environment)')
  }
  if (mode !== 'raw') {
    const write = operation.create(serial, 'write', { mode: mode, data: [data] })
    await write
  } else {
    serial.postMessage({ operation: 'write', data: { mode: mode, data: [data] } })
  }
}

function read (mode) {
  if (!serial) {
    throw new Error('Serial worker not available (SSR environment)')
  }
  serial.postMessage({ operation: 'read', data: mode })
}

function closeReader () {
  if (!serial) {
    throw new Error('Serial worker not available (SSR environment)')
  }
  serial.postMessage({ operation: 'stop reading' })
}

export {
    closeReader, connect,
    disconnect, read, write
}

