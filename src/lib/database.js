import { MongoClient } from 'mongodb'
import { curry, prop } from 'ramda'

const DATABASE_URL = process.env.BURRO_DB_URL
const DATABASE_NAME = process.env.BURRO_DB_NAME


export const connect = async () => {
  const connection = await MongoClient.connect(DATABASE_URL, { useUnifiedTopology: true })
  const database = connection.db(DATABASE_NAME)
  return {
    connection,
    database,
  }
}
