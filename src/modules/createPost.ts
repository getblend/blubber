import cuid from 'cuid'
import axios from 'axios'

export type Post = {
  id: string
  description: string
  height: number
  width: number
  profile: string
  username: string
  blurhash: string
  creatorId: string
  image: string
}

export const createPost = ({
  id,
  description,
  height,
  width,
  profile,
  username,
  blurhash,
  creatorId,
  image,
}: Post) => {
  const postData = JSON.stringify({
    id,
    alt_description: description,
    color: '#d9d9d9',
    description,
    height,
    width,
    likes: 0,
    storeid: '2815b9be-1cbe-4975-8275-68d21ffce8c1',
    creator: {
      creatorid: creatorId,
      name: username,
      username: username,
      profile_image: `https://webmenu.sgp1.cdn.digitaloceanspaces.com/creators/${profile}.jpg`,
    },
    urls: {
      blur_hash: blurhash,
      download: `https://webmenu.sgp1.cdn.digitaloceanspaces.com/image-posts/orig.${image}.jpg`,
      regular: `https://webmenu.sgp1.cdn.digitaloceanspaces.com/image-posts/${image}.jpg`,
      small_s3: `https://webmenu.sgp1.digitaloceanspaces.com/image-posts/${image}.jpg`,
    },
  })
  return axios.post('https://menuapi.theblend.co.in/post', postData, {
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': 'e91a70ac-9a98-49e6-894f-3906df52927b',
    },
  })
}
