import { Client } from 'pg'

const url = new URL(process.env.DATABASE_URL!)
const dbName = url.pathname.slice(1)

url.pathname = '/postgres'
const client = new Client({ connectionString: url.toString() })

await client.connect()

const res = await client.query(`SELECT 1 FROM pg_database WHERE datname = $1`, [dbName])
if (res.rowCount === 0) {
  await client.query(`CREATE DATABASE "${dbName}"`)
  console.log(`Created database: ${dbName}`)
} else {
  console.log(`Database already exists: ${dbName}`)
}

await client.end()
