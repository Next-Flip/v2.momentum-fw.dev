import * as flipper from './core'
import { Operation } from './util'
import { BluetoothTransport } from './webBluetooth'

const operation = new Operation()
const filters = [
  { usbVendorId: 0x0483, usbProductId: 0x5740 }
]

let serial = null

function setupTransport (transport) {
  serial = transport
  serial.onmessage = (e) => {
    if (e.data.operation === 'cli output') {
      flipper.emitter.emit('cli output', e.data.data)
    } else if (e.data.operation === 'raw output') {
      flipper.emitter.emit('raw output', e.data.data)
    } else if (e.data.operation === 'write/end') {
      flipper.emitter.emit('write/end')
    } else if (e.data.operation === 'disconnect') {
      flipper.emitter.emit('disconnect')
    } else {
      operation.terminate(e.data)
    }
  }
}

// Only create the USB worker in browser environments
if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
  setupTransport(new Worker(new URL('./workers/webSerial.js', import.meta.url)))

  if (navigator.serial) {
    navigator.serial.addEventListener('disconnect', () => {
      flipper.emitter.emit('disconnect')
    })
  }
}

async function connect () {
  if (!serial) {
    throw new Error('Serial worker not available (SSR environment)')
  }
  const ports = await navigator.serial.getPorts({ filters })
  if (ports.length === 0) {
    throw new Error('No known ports')
  }
  const conn = operation.create(serial, 'connect')
  await conn
}

async function connectBluetooth (device) {
  if (typeof window === 'undefined') {
    throw new Error('Not in browser environment')
  }
  if (!('bluetooth' in navigator)) {
    throw new Error('Web Bluetooth not supported')
  }
  const bt = new BluetoothTransport()
  setupTransport(bt)
  await operation.create(serial, 'connect', device)
}

async function disconnect () {
  if (!serial) {
    throw new Error('Serial worker not available (SSR environment)')
  }
  const conn = operation.create(serial, 'disconnect')
  await conn
}

async function write (mode, data) {
  if (!serial) {
    throw new Error('Serial worker not available (SSR environment)')
  }
  if (mode !== 'raw') {
    const w = operation.create(serial, 'write', { mode: mode, data: [data] })
    await w
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
  closeReader, connect, connectBluetooth,
  disconnect, read, write
}
