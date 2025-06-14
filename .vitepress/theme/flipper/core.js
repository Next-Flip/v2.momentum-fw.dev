import { emitter } from './emitter';

// Conditionally import serial functions only in browser environment
let serialModule = null

if (typeof window !== 'undefined') {
  serialModule = import('./serial')
}

// Wrapper functions that handle dynamic imports
const connect = async () => {
  if (!serialModule) {
    throw new Error('Serial not available in SSR')
  }
  const module = await serialModule
  return module.connect()
}

const disconnect = async () => {
  if (!serialModule) {
    throw new Error('Serial not available in SSR')
  }
  const module = await serialModule
  return module.disconnect()
}

const write = async (mode, data) => {
  if (!serialModule) {
    throw new Error('Serial not available in SSR')
  }
  const module = await serialModule
  return module.write(mode, data)
}

const read = async (mode) => {
  if (!serialModule) {
    throw new Error('Serial not available in SSR')
  }
  const module = await serialModule
  return module.read(mode)
}

const closeReader = async () => {
  if (!serialModule) {
    throw new Error('Serial not available in SSR')
  }
  const module = await serialModule
  return module.closeReader()
}

import * as commands from './protobuf/commands/core';

export {
    closeReader,
    commands, connect,
    disconnect, emitter, read, write
};

