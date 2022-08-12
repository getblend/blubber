import {Command, Flags} from '@oclif/core'

import axios from 'axios'
import {pipeline} from 'node:stream'
import sharp from 'sharp'
import {
  await$,
  createBlobWriter$,
  Flags as UploadFlags,
  root,
} from '../../modules/blob'
import {
  computeBlurhash,
  computeHash,
  transform,
} from '../../modules/imageOptimization'
import {logger} from '../../modules/logger'

const SHEETS_URI =
  'https://script.google.com/macros/s/AKfycbwUdXppuWQW-V1ovdqwFxSO6U8UFoQBjP15tPAa9Wc4pdOAHySWlCE-2_LJA9-T5xiT/exec'

type BlobContainer = 'users' | 'restaurants' | 'imagePosts'

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

  private readonly cache: Record<
    BlobContainer,
    Record<string, {file: string; name: string; blurhash: string}>
  > = {
    users: {},
    restaurants: {},
    imagePosts: {},
  }

  async run(): Promise<void> {
    const {args, flags} = await this.parse(Upload)

    const dataStream = this.getDataFromSheets()

    for await (const page of dataStream) {
      logger('batchFetcher').info(
        `Processing ${page.count} of ${page.total} items`,
      )
      const promises = [
        ...this.uploadProfiles(flags, page),
        ...this.uploadAssets(flags, page),
      ]
      await Promise.all(promises)
    }
    this.log('Done.', this.cache)
  }

  /** Upload the profile images to blob storage  */
  private uploadProfiles(flags: UploadFlags, page: Collection<Node>) {
    const log = logger('profileUpload')
    log.info(`Uploading ${page.nodes.length} profiles`)

    const promises = []
    for (const item of page.nodes) {
      const {vin: profile} = item
      log.info(`Uploading profile for ${profile}`)
      promises.push(this.uploadImage(flags, profile, 'users'))
    }

    return promises
  }

  /** Upload the assets to blob storage  */
  private uploadAssets(flags: UploadFlags, page: Collection<Node>) {
    const log = logger('assetUpload')
    log.info(`Uploading ${page.nodes.length} assets`)

    const promises = []
    for (const item of page.nodes) {
      const {vin: image} = item
      log.info(`Uploading assets for ${image}`)
      promises.push(this.uploadImage(flags, image, 'imagePosts'))
    }

    return promises
  }

  private async uploadImage(
    flags: UploadFlags,
    image: string,
    scope: BlobContainer,
  ): Promise<{file: string; name: string; blurhash: string}> {
    if (this.cache[scope][image]) {
      return this.cache[scope][image]
    }

    const image$ = sharp(root(flags, `sources/${scope}/${image}.jpg`))
    const compressed$ = transform.compressed(image$)

    const [name, blurhash] = await Promise.all([
      computeHash(compressed$),
      computeBlurhash(compressed$),
    ])

    logger('compression').info('Processed image:', {name, blurhash})

    switch (scope) {
      case 'users': {
        transform
          .avatar(compressed$)
          .pipe(createBlobWriter$(flags, scope, name))
        break
      }

      case 'restaurants': {
        transform
          .avatar(compressed$)
          .pipe(createBlobWriter$(flags, scope, name))
        break
      }

      case 'imagePosts': {
        await Promise.all([
          await$(
            transform
              .original(image$)
              .pipe(createBlobWriter$(flags, scope, `orig.${name}`)),
          ),
          await$(compressed$.pipe(createBlobWriter$(flags, scope, name))),
        ])
        break
      }
    }

    this.cache[scope][image] = {
      file: image,
      name,
      blurhash,
    }

    return this.cache[scope][image]
  }

  private async *getDataFromSheets(): AsyncGenerator<Collection<Node>, void> {
    let cursor = ''
    let hasMore = true
    let batch = 1

    while (hasMore) {
      logger('batchFetcher').info(`Fetching batch ${batch} from sheets`)

      const {data} = await axios.get<Collection<Node>>(SHEETS_URI, {
        params: {
          cursor: cursor,
        },
      })
      hasMore = data.hasMore
      cursor = data.cursor
      batch++

      yield data
    }

    return
  }
}

export interface Node {
  id: string
  vin: string
}

export interface Collection<TNode> {
  count: number
  cursor: string
  hasMore: boolean
  nodes: TNode[]
  total: number
}
