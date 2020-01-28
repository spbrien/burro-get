import { filter, map, prop, forEach } from 'ramda'
import { getChannels, getMessages } from './lib/slack'
import { connect } from './lib/database'


export const init = async (f) => {
  const { connection, database } = await connect()
  const res = await f(database, connection)
}


export const createChannels = async (database, connection) => {
  const channels = await database.createCollection('channels')
  const messages = await database.createCollection('messages')
  const handler = async (result) => {
    const id = prop('id', result)
    const exists = await channels.findOne({ id: id })
    if (!exists) {
      return await channels.insertOne(result)
    }
    return null
  }

  const data = await getChannels()
  const inserted = await Promise.all(
    filter(item => item, map(handler, data))
  )

  if (connection) {
    connection.close()
  }
  return inserted
}

export const createMessages = async (database, connection) => {
  const channels = await database.collection('channels').find({}).toArray()
  const ids = map((item) => prop('id', item), channels)

  const lastMessage = await database.collection('messages').find({}).limit(1).sort({$natural:-1})

  const messageHandler = channel => async (message) => {
    message.channel = channel
    const ts = prop('ts', message)
    const exists = await database.collection('messages').findOne({ ts: ts })
    if (!exists) {
      console.log(`Creating new message: ${ts}`)
      return await database.collection('messages').insertOne(message)
    }
    return !exists
  }

  const channelHandler = async (channel) => {
    const messages = await getMessages(channel)
    if (messages) {
      console.log(`Processing ${messages.length} messages...`)
      const results = await Promise.all(
        filter(item => item, map(messageHandler(channel), messages))
      )
      return results
    }
    return !messages
  }

  const results = await Promise.all(
    filter(item => item, map(channelHandler, ids))
  )

  if (connection) {
    connection.close()
  }
  return results
}

export const collectData = () => init(async (database, connection) => {
  const c = await createChannels(database)
  const m = await createMessages(database)
  connection.close()
})
