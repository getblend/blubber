import {encode} from 'blurhash'
import crypto from 'node:crypto'
import sharp from 'sharp'

export const transform = {
  avatar: (stream: sharp.Sharp) =>
    stream
      .clone()
      .resize({
        width: 200,
        height: 200,
        fit: sharp.fit.cover,
        position: sharp.strategy.entropy,
        withoutEnlargement: true,
      })
      .jpeg({chromaSubsampling: '4:4:4', quality: 80}),
  compressed: (stream: sharp.Sharp) =>
    stream
      .clone()
      .resize({
        height: 1000,
        withoutEnlargement: true,
      })
      .jpeg({chromaSubsampling: '4:4:4', quality: 80}),
  original: (stream: sharp.Sharp) => stream.clone().jpeg({quality: 100}),
  subpixel: (stream: sharp.Sharp) =>
    stream.clone().raw().ensureAlpha().resize(32, 32, {fit: 'inside'}),
} as const

export async function computeBlurhash(
  sharpStream: sharp.Sharp,
): Promise<{blurhash: string; height: number; width: number}> {
  const {
    data,
    info: {width, height},
  } = await sharpStream
    .clone()
    .raw()
    .ensureAlpha()
    .resize(32, 32, {fit: 'inside'})
    .toBuffer({resolveWithObject: true})
  return {
    blurhash: encode(new Uint8ClampedArray(data), width, height, 4, 4),
    height,
    width,
  }
}

export function computeHash(sharpStream: sharp.Sharp): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1').setEncoding('hex')
    transform
      .subpixel(sharpStream)
      .pipe(hash)
      .once('error', reject)
      .once('finish', () => resolve(hash.read()))
  })
}
