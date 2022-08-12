import {Command, Flags} from '@oclif/core'

import cuid from 'cuid'
import axios from 'axios'
import sharp from 'sharp'
import {
  await$,
  createBlobWriter$,
  Flags as UploadFlags,
  root,
} from '../../modules/blob'
import {createPost} from '../../modules/createPost'
import {
  computeBlurhash,
  computeHash,
  transform,
} from '../../modules/imageOptimization'
import {logger} from '../../modules/logger'

const SHEETS_URI =
  'https://script.google.com/macros/s/AKfycbwUdXppuWQW-V1ovdqwFxSO6U8UFoQBjP15tPAa9Wc4pdOAHySWlCE-2_LJA9-T5xiT/exec'

type BlobContainer = 'users' | 'restaurants' | 'imagePosts'

type CompressedOutput = {
  originalFilename: string
  hashedFilename: string
  blurhash: string
  id: string
  height: number
  width: number
}

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
    Record<string, CompressedOutput>
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
      const posts = await Promise.all(this.uploadPosts(flags, page))
      this.log('Posts.', posts)
    }

    this.log('Done.', this.cache)
  }

  private uploadPosts(flags: UploadFlags, page: Collection<Node>) {
    const log = logger('postsUpload')
    log.info(`Uploading ${page.nodes.length} posts`)

    const promises = []
    for (const item of page.nodes) {
      const {creator, description, file, id, store} = item
      log.info(`Uploading profile for ${file}`)

      const promise = (async () => {
        try {
          const {status, data} = await createPost({
            // image data
            id: this.cache.imagePosts[file].id,
            blurhash: this.cache.imagePosts[file].blurhash,
            description,
            height: this.cache.imagePosts[file].height,
            width: this.cache.imagePosts[file].width,
            image: this.cache.imagePosts[file].hashedFilename,

            // creator data
            creatorId: this.cache.users[creator].id,
            profile: this.cache.users[creator].hashedFilename,
            username: creator,
          })
          if (status !== 200) {
            throw new Error("Couldn't create post")
          }
          log.info(`Created post: ${file}`)
          return data
        } catch (error) {
          log.error(`Couldn't create post: ${file}`)
          log.error(error)
        }
      })()

      promises.push(promise)
    }

    return promises
  }

  /** Upload the profile images to blob storage  */
  private uploadProfiles(flags: UploadFlags, page: Collection<Node>) {
    const log = logger('profileUpload')
    log.info(`Uploading ${page.nodes.length} profiles`)

    const promises = []
    for (const item of page.nodes) {
      const {creator: profile} = item
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
      const {file: image} = item
      log.info(`Uploading assets for ${image}`)
      promises.push(this.uploadImage(flags, image, 'imagePosts'))
    }

    return promises
  }

  private async uploadImage(
    flags: UploadFlags,
    image: string,
    scope: BlobContainer,
  ): Promise<CompressedOutput> {
    if (this.cache[scope][image]) {
      return this.cache[scope][image]
    }

    const image$ = sharp(root(flags, `sources/${scope}/${image}.jpg`))
    const compressed$ = transform.compressed(image$)

    const [name, {blurhash, width, height}] = await Promise.all([
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
      originalFilename: image,
      hashedFilename: name,
      blurhash,
      id: cuid(),
      height,
      width,
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
  file: string
  creator: string
  store: string
  description: string
}

export interface Collection<TNode> {
  count: number
  cursor: string
  hasMore: boolean
  nodes: TNode[]
  total: number
}
