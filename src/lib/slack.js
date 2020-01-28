import axios from 'axios'
import rateLimit from 'axios-rate-limit';

import { path, prop, concat } from 'ramda'

const TOKEN = process.env.BURRO_TOKEN
const URL = process.env.BURRO_URL
const AUTH = {
  token: TOKEN
}

const getChannelId = prop('id')

const slack = rateLimit(axios.create({
  baseURL: URL,
  timeout: 1000,
}), { maxRPS: 1 })

export const getChannels = async () => {
  const params = {
    ...AUTH,
  }
  const result = await slack.get('conversations.list', { params })
  const data = path(['data', 'channels'], result)
  return data
}

export const getMessages = async (channel, cursor) => {
  let more = []
  const params = {
    ...AUTH,
    channel,
    cursor,
  }
  const result = await slack.get('conversations.history', { params })
  const messages = path(['data', 'messages'], result)

  const hasMore = path(['data', 'has_more'], result)
  if (hasMore) {
    const nextCursor = path(['data', 'response_metadata', 'next_cursor'], result)
    if (nextCursor) {
      console.log('Requesting from cursor: ', nextCursor)
      more = await getMessages(channel, nextCursor)
    }

  }
  if (messages && more) {
    return concat(messages, more)
  }
  return messages
}
