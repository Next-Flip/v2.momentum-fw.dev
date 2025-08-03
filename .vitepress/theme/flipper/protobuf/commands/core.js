import asyncSleep from 'simple-async-sleep'
import { emitter } from '../../emitter'
import * as rpc from '../rpc'

import * as gui from './gui'
import * as storage from './storage'
import * as system from './system'

let flipper, rpcIdle = true
const commandQueue = []

function enqueue (c) {
  if (!c.commandId) c.commandId = rpc.nextCommandId()
  commandQueue.push(c)
  if (rpcIdle) {
    sendRpcRequest()
  }
  return c.commandId
}

async function sendRpcRequest () {
  rpcIdle = false

  while (commandQueue.length) {
    const c = commandQueue[0]

    const req = rpc.createRequest(c.requestType, c.args, c.hasNext, c.commandId)
    await flipper.write('raw', req.data)

    let res = { commandId: req.commandId }
    if (!c.hasNext && c.requestType !== 'stopSession') {
      let buffer = new Uint8Array(0)
      const unbind = emitter.on('raw output', data => {
        const newBuffer = new Uint8Array(buffer.length + data.length)
        newBuffer.set(buffer)
        newBuffer.set(data, buffer.length)
        buffer = newBuffer
        try {
          res = rpc.parseResponse(buffer)
          if (res) {
            buffer = new Uint8Array(0)
            if (res.commandId === 0) {
              emitter.emit('screen frame', res.data)
            } else {
              emitter.emit('response', res)
            }
          } else if (res === null) {
            // parseResponse returned null due to screen frame error
            buffer = new Uint8Array(0)
            unbind()
          }
        } catch (error) {
          if (!(error.toString().includes('index out of range'))) {
            if (error.toString().includes('invalid wire type') || error.toString().includes('Cannot read properties of null')) {
              emitter.emit('restart session')
              unbind()
            } else {
              throw error
            }
          }
        }
      })
      const unbindStop = emitter.on('stop screen streaming', () => {
        unbind()
        unbindStop()
      })
    } else {
      const unbind = emitter.on('write/end', () => {
        emitter.emit('response', res)
        unbind()
      })
    }
    commandQueue.shift()
  }

  rpcIdle = true
}

async function startRpcSession (f) {
  flipper = f
  await asyncSleep(500)
  await flipper.write('cli', 'start_rpc_session\r')
  flipper.read('raw')
  await asyncSleep(500)
  return system.ping()
}

function stopRpcSession () {
  return new Promise((resolve) => {
    const commandId = enqueue({
      requestType: 'stopSession',
      args: {}
    })
    const unbind = emitter.on('response', async (res) => {
      if (res.commandId !== commandId) return;
      await asyncSleep(300)
      await flipper.closeReader()
      rpc.flushCommandQueue()
      resolve()
      unbind()
    })
  })
}

export {
    emitter,
    enqueue, gui, startRpcSession,
    stopRpcSession, storage, system
}

