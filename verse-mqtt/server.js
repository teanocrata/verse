'use strict'

const debug = require('debug')('verse:mqtt')
const mosca = require('mosca')
const redis = require('redis')
const chalk = require('chalk')
const db = require('verse-db')

const { parsePayload } = require('./utils.js')

const backend = {
  type: 'redis',
  redis,
  return_buffers: true
}

const settings = {
  port: 1883,
  backend
}

const config = {
  database: process.env.DB_NAME || 'verse',
  username: process.env.DB_USER || 'verse',
  password: process.env.DB_PASS || 'verse',
  host: process.env.DB_HOST || 'localhost',
  dialect: 'postgres',
  logging: s => debug(s)
}

const handleFatalError = (err) => {
  handleError(err)
  process.exit(1)
}

const handleError = (err) => {
  console.error(`${chalk.red(`[fatal error] ${err.message}`)}`)
  console.error(err.stack)
}

const server = new mosca.Server(settings)
const clients = new Map()

let Agent, Metric

server.on('clientConnected', client => {
  debug(`Client Connected: ${client.id}`)
  clients.set(client.id, null)
})

server.on('clientDisconnected', async (client) => {
  debug(`Client Disonnected: ${client.id}`)
  const agent = clients.get(client.id)
  if (agent) {
    // Mark Agent as Disconnected
    agent.connected = false

    try {
      await Agent.createOrUpdate(agent)
    } catch (e) {
      return handleError(e)
    } finally {

    }

    // Delete agent from Clients list
    clients.delete(client.id)
    server.publish({
      topic: 'agent/disconnected',
      payload: JSON.stringify({
        agent: {
          uuid: agent.uuid
        }
      })
    })
    debug(`Client (${client.id}) associated to Agent (${agent.uuid}) marked as disconnected`)
  }
})

server.on('published', async (packet, client) => {
  debug(`Received: ${packet.topic}`)

  switch (packet.topic) {
    case 'agent/connected':
    case 'agent/disconnected':
      debug(`Payload: ${packet.payload}`)
      break
    case 'agent/message':
      debug(`Payload: ${packet.payload}`)
      const payload = parsePayload(packet.payload)
      if (payload) {
        payload.agent.connected = true

        let agent
        try {
          agent = await Agent.createOrUpdate(payload.agent)
        } catch (e) {
          return handleError(e)
        }

        debug(`Agent ${agent.uuid} saved`)

        // Notify Agent is Connected
        if (!clients.get(client.id, agent)) {
          clients.set(client)
          server.publish({
            topic: 'agent/connected',
            payload: JSON.stringify({
              agent: {
                uuid: agent.uuid,
                name: agent.name,
                hostname: agent.hostname,
                pid: agent.pid
              }
            })
          })
        }

        // Store Metrics
        try {
          await Promise.all(payload.metrics.map(metric => Metric.create(agent.uuid, metric)))
        } catch (err) {
          return handleError(err)
        }
      }

      break
    default:
  }
})

server.on('ready', async () => {
  const services = await db(config).catch(handleFatalError)

  Agent = services.Agent
  Metric = services.Metric
  console.log(`${chalk.green('[verse-mqtt] server is running')}`)
})

server.on('error', handleFatalError)

process.on('uncaughtException', handleFatalError)
process.on('unhandleRejection', handleFatalError)
