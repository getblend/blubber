import fs from 'node:fs'
import path from 'node:path'
import {addAbortSignal, Stream} from 'node:stream'

export type Flags = {
  src: string
}

export function root(flags: Flags, ...paths: string[]): string {
  const location = path.resolve(flags.src, ...paths)
  return location
}

export function createBlobWriter$(
  flags: Flags,
  scope: string,
  name: string,
): fs.WriteStream {
  return fs.createWriteStream(root(flags, `generated/${scope}/${name}.jpg`), {
    flags: 'w',
  })
}

export function await$<T extends Stream>(
  stream: T,
): Promise<T> & {cancel(): void} {
  const ac = new AbortController()
  const promise = new Promise<T>((resolve, reject) => {
    addAbortSignal(ac.signal, stream)
      .once('finish', () => resolve(stream))
      .once('error', reject)
  })
  return Object.assign(promise, {
    cancel: () => ac.abort(),
  })
}
