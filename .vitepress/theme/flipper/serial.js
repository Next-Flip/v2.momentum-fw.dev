import * as flipper from './core'

const filters = [
  { usbVendorId: 0x0483, usbProductId: 0x5740 }
]

let port, reader, readComplete = false, writerIdle = true
const writeQueue = []

// Only create worker in browser environment
if (typeof window !== 'undefined' && typeof Worker !== 'undefined') {
//   serial.onmessage = (e) => {
//     if (e.data.operation === 'cli output') {
//       flipper.emitter.emit('cli output', e.data.data)
//     } else if (e.data.operation === 'raw output') {
//       flipper.emitter.emit('raw output', e.data.data)
//     } else if (e.data.operation === 'write/end') {
//       flipper.emitter.emit('write/end')
//     } else {
//       operation.terminate(e.data)
//     }
//   }
  navigator.serial.addEventListener("disconnect", () => {
    flipper.emitter.emit('disconnect')
  })
}

async function connect () {
  if (!navigator.serial) {
    throw new Error('Serial not available (SSR environment)')
  }
  const ports = await navigator.serial.getPorts({ filters })
  window.port = port
  if (ports.length === 0) {
    throw new Error('No known ports')
  }
//   const connect = operation.create(serial, 'connect')
//   await connect
  port = ports[0]
  await port.open({ baudRate: 230400 })
    .catch(async error => {
        console.log(error)
      if (error.toString().includes('The port is already open')) {
        await port.close()
        return await connect()
      } else {
        throw error
      }
    })
}

async function disconnect () {
  if (!navigator.serial) {
    throw new Error('Serial not available (SSR environment)')
  }
//   const disconnect = operation.create(serial, 'disconnect')
//   await disconnect
  if (port && !port.closed) {
    port.close()
      .catch(error => {
        if (!(error.toString().includes('The port is already closed.'))) {
          throw error
        }
      })
  }
}

async function writeInner () {
  writerIdle = false
  while (writeQueue.length) {
    const entry = writeQueue[0]
    if (!port.writable) {
        throw 'Writable stream closed'
    //   self.postMessage({
    //     operation: 'write',
    //     status: 0,
    //     error: 'Writable stream closed'
    //   })
    //   return
    }
    const writer = port.writable.getWriter()

    if (entry.mode.startsWith('cli')) {
      if (entry.mode === 'cli/delimited') {
        entry.data.push('\r\n')
      }
      const encoder = new TextEncoder()
      entry.data.forEach(async (line, i) => {
        let message = line
        if (entry.data[i + 1]) {
          message = line + '\r\n'
        }
        console.log(message, encoder.encode(message))
        await writer.write(encoder.encode(message))
      })
    } else if (entry.mode === 'raw') {
        console.log(entry, entry.data[0])
      await writer.write(entry.data[0])
    } else {
      throw new Error('Unknown write mode:', entry.mode)
    }

    await writer.close()
      .then(() => {
        writeQueue.shift()
        flipper.emitter.emit('write/end')
        // self.postMessage({
        //   operation: 'write',
        //   status: 1
        // })
      })
      .catch(error => {
        throw error
      })
  }
  writerIdle = true
}

async function write (mode, data) {
  if (!navigator.serial) {
    throw new Error('Serial not available (SSR environment)')
  }
//   if (mode !== 'raw') {
//     const write = operation.create(serial, 'write', { mode: mode, data: [data] })
//     await write
//   } else {
//     serial.postMessage({ operation: 'write', data: { mode: mode, data: [data] } })
//   }
  writeQueue.push({ mode: mode, data: [data]})
  if (writerIdle) {
    writeInner()
  }
}

async function readInner (mode) {
  try {
    reader = port.readable.getReader()
  } catch (error) {
    if (!error.toString().includes('locked to a reader')) {
      throw error
    }
  }
  const decoder = new TextDecoder()
  let buffer = new Uint8Array(0)
  readComplete = false

  while (!readComplete) {
    console.log("reading")
    await reader.read()
      .then(({ done, value }) => {
        if (done) {
            console.log("reading done")
          readComplete = true
        } else {
            console.log("read", value)
          if (mode) {
            flipper.emitter.emit(mode + ' output', value)
          } else {
            const newBuffer = new Uint8Array(buffer.length + value.length)
            newBuffer.set(buffer)
            newBuffer.set(value, buffer.length)
            buffer = newBuffer

            if (decoder.decode(buffer.slice(-12)).replace(/\s/g, '').endsWith('>:\x07')) {
            console.log("reading >:")
              readComplete = true
            //   self.postMessage({
            //     operation: 'read',
            //     data: 'read',
            //     status: 1
            //   })
            }
          }
        }
      })
      .catch(error => {
        if (error.toString().includes('The device has been lost.')) {
          readComplete = true
        } else {
          throw error
        }
      })
  }
            console.log("reading after")
  await reader.cancel()
    // .then(() => {
    //   self.postMessage({
    //     operation: 'read',
    //     status: 1,
    //     data: buffer
    //   })
    // })
    // .catch(error => {
    //   self.postMessage({
    //     operation: 'read',
    //     status: 0,
    //     error: error
    //   })
    // })
            console.log("reading cancel")
}

function read (mode) {
  if (!navigator.serial) {
    throw new Error('Serial not available (SSR environment)')
  }
//   serial.postMessage({ operation: 'read', data: mode })
  readInner(mode)
}

function closeReader () {
  if (!navigator.serial) {
    throw new Error('Serial not available (SSR environment)')
  }
//   serial.postMessage({ operation: 'stop reading' })
  if(reader) reader.cancel()
}

export {
    closeReader, connect,
    disconnect, read, write
}

