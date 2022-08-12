import {Command, Flags} from '@oclif/core'

import axios from 'axios'
import sharp from 'sharp'
import fs from 'node:fs'
import path from 'node:path'
import crypto from 'node:crypto'
import {encode} from 'blurhash'

type Flags = {
  src: string
}

const SHEETS_URI =
  'https://script.google.com/macros/s/AKfycbwUdXppuWQW-V1ovdqwFxSO6U8UFoQBjP15tPAa9Wc4pdOAHySWlCE-2_LJA9-T5xiT/exec'

export default class Upload extends Command {
  static description = 'begin uploading content'

  static examples = [
    `$ oex blubber upload --src <path to directory>
`,
  ]

  static flags = {
    src: Flags.string({
      char: 's',
      description: 'Path to the directory containing the content to upload',
      required: true,
    }),
  }

  static args = [
    // {name: 'person', description: 'Person to say hello to', required: true},
  ]

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Upload)

    const data = await getDataFromSheets()
    for await (const batch of data) {
      if (batch.length === 0) {
        break
      }

      this.log('Processing batch of ' + batch.length + ' items')

      const profilesCache = new Map<string, string>()
      const postsCache = new Map<string, string>()

      const [profileMap, assetMap] = await Promise.all([
        uploadProfiles(flags, batch, profilesCache),
        uploadAssets(flags, batch, postsCache),
      ])

      await uploadPosts(flags, batch, profileMap, assetMap)
    }
  }
}

export interface Node {
  id: string
  // image: string;
  // profile: string;

  // TODO: temporary
  vin: string
}

export interface Collection<TNode> {
  count: number
  cursor: string
  hasMore: boolean
  nodes: TNode[]
  total: number
}

// ---- Helpers ---- //

async function* getDataFromSheets(): AsyncGenerator<Node[], void> {
  let cursor = ''
  let hasMore = true

  while (hasMore) {
    const {data} = await axios.get<Collection<Node>>(SHEETS_URI, {
      params: {
        cursor: cursor,
      },
    })
    hasMore = data.hasMore
    cursor = data.cursor
    yield data.nodes
  }

  return
}

async function uploadPosts(
  flags: Flags,
  batch: Node[],
  profileMap: Map<string, string>,
  assetMap: Map<string, string>,
): Promise<void> {
  console.log('uploadPosts', profileMap, assetMap, batch)
}

/** Upload the assets to blob storage  */
async function uploadAssets(
  flags: Flags,
  batch: Node[],
  cache: Map<string, string> = new Map(),
): Promise<Map<string, string>> {
  for (const node of batch) {
    const {vin: image} = node
    console.log(`Uploading assets for ${image}`)

    if (!image) {
      continue
    }
    const uploadedImage = await uploadImage(flags, image, 'imagePosts')
    cache.set(uploadedImage.file, uploadedImage.name)
  }
  return cache
}

/** Upload the profile images to blob storage  */
async function uploadProfiles(
  flags: Flags,
  batch: Node[],
  cache: Map<string, string> = new Map(),
): Promise<Map<string, string>> {
  for (const node of batch) {
    const {vin: profile} = node
    console.log(`Uploading profile for ${profile}`)

    if (!profile) {
      continue
    }
    const image = await uploadImage(flags, profile, 'users')
    cache.set(image.file, image.name)
  }
  return cache
}

async function uploadImage(
  flags: Flags,
  image: string,
  scope: 'users' | 'restaurants' | 'imagePosts',
): Promise<{
  blurhash: string
  file: string
  name: string
}> {
  const sharpStream = sharp(root(flags, `sources/${scope}/${image}.png`))
  const compressed = sharpStream
    .clone()
    .resize({
      height: 1000,
      withoutEnlargement: true,
    })
    .jpeg({chromaSubsampling: '4:4:4', quality: 80})

  const name = await computeHash(compressed)
  const blurhash = await generateBlurhash(compressed)
  const uploadStream = makeBlobStream(flags, scope, name)

  switch (scope) {
    case 'users': {
      makeAvatar(compressed).jpeg().pipe(uploadStream)
      break
    }

    case 'restaurants': {
      makeAvatar(compressed).jpeg().pipe(uploadStream)
      break
    }

    case 'imagePosts': {
      compressed.clone().pipe(uploadStream)

      const originalUploadStream = makeBlobStream(flags, scope, `orig.${name}`)
      sharpStream.clone().jpeg({quality: 100}).pipe(originalUploadStream)
      await awaitStream(originalUploadStream)
      break
    }
  }

  await awaitStream(uploadStream)
  return {
    file: image,
    name,
    blurhash,
  }
}

// -- Utilities -- //
function makeAvatar(sharpStream: sharp.Sharp): sharp.Sharp {
  return sharpStream.clone().resize({
    width: 200,
    height: 200,
    fit: sharp.fit.cover,
    position: sharp.strategy.entropy,
    withoutEnlargement: true,
  })
}

function generateBlurhash(sharpStream: sharp.Sharp): Promise<string> {
  return new Promise((resolve, reject) =>
    sharpStream
      .clone()
      .raw()
      .ensureAlpha()
      .resize(32, 32, {fit: 'inside'})
      .toBuffer((err, buffer, {width, height}) => {
        if (err) return reject(err)
        resolve(encode(new Uint8ClampedArray(buffer), width, height, 4, 4))
      }),
  )
}

function root(flags: Flags, ...paths: string[]): string {
  const location = path.resolve(flags.src, ...paths)
  console.log(`Accessing: ${location}`)
  return location
}

function computeHash(sharpStream: sharp.Sharp): Promise<string> {
  return new Promise((resolve, reject) => {
    const hash = crypto.createHash('sha1').setEncoding('hex')
    sharpStream
      .clone()
      .pipe(hash)
      .once('error', reject)
      .once('finish', () => resolve(hash.read()))
  })
}

function makeBlobStream(
  flags: Flags,
  scope: string,
  name: string,
): fs.WriteStream {
  return fs.createWriteStream(root(flags, `blobs/${scope}/${name}.png`))
}

function awaitStream<T extends NodeJS.WritableStream>(stream: T): Promise<T> {
  return new Promise<T>((resolve, reject) => {
    stream.once('finish', () => resolve(stream)).once('error', reject)
  })
}
