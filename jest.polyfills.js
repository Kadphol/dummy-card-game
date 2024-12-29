/* eslint-disable @typescript-eslint/no-require-imports */
// jest.polyfills.js
/**
 * @note The block below contains polyfills for Node.js globals
 * required for Jest to function when running JSDOM tests.
 * These HAVE to be require's and HAVE to be in this exact
 * order, since "undici" depends on the "TextEncoder" global API.
 *
 * Consider migrating to a more modern test runner if
 * you don't want to deal with this.
 */

const { performance } = require('node:perf_hooks')
const { TextDecoder, TextEncoder } = require('node:util')
const { ReadableStream, TransformStream } = require('node:stream/web')
const { clearImmediate } = require('node:timers')

Object.defineProperties(global, {
  TextDecoder: { value: TextDecoder },
  TextEncoder: { value: TextEncoder },
  ReadableStream: { value: ReadableStream },
  TransformStream: { value: TransformStream },
  performance: { value: performance, writable: true },
  clearImmediate: { value: clearImmediate, writable: true },
})

const { Blob, File } = require('node:buffer')
const { fetch, Headers, FormData, Request, Response } = require('undici')

Object.defineProperties(global, {
  fetch: { value: fetch, writable: true },
  Blob: { value: Blob },
  File: { value: File },
  Headers: { value: Headers },
  FormData: { value: FormData },
  Request: { value: Request },
  Response: { value: Response },
})
