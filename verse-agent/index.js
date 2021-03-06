'use strict'

const debug = require('debug')('verse:agent')
const uuid = require('uuid')
const mqtt = require('mqtt')
const defaults = require('defaults')
const EventEmitter = require('events')

const { parsePayload } = require('./utils')

const options = {
  name: 'untitled',
  username: 'verse',
  interval: 5000,
  mqtt: {
    host: 'http://localhost'
  }
}
class VerseAgent extends EventEmitter {
  constructor (opts) {
    super()

    this._options = defaults(opts, options)
    this._started = false
    this._timer = null
    this._client = null
    this._opts = opts
    this._agentId = null
  }

  connect () {
    if (!this._started) {
      const opts = this._opts
      this._client = mqtt.connect(opts.mqtt.host)
      this._started = true

      this._client.subscribe('agent/message')
      this._client.subscribe('agent/connected')
      this._client.subscribe('agent/disconnect')

      this._client.on('connect', () => {
        this._agentId = uuid.v4()

        this.emit('connected', this._agentId)
        this._timer = setInterval(() => {
          this.emit('agent/message', 'this is a message')
        }, opts.interval)
      })

      this._client.on('message', (topic, payload) => {
        payload = parsePayload(payload)

        let broadcast = false
        switch (topic) {
          case 'agent/connected':
          case 'agent/disconnected':
          case 'agent/message':
            broadcast = payload && payload.agent && payload.agent.uuid !== this._agentId
            break
        }

        if (broadcast) {
          this.emit(topic, payload)
        }
      })

      this._client.on('error', this.disconnect())
    }
  }

  disconnect () {
    if (this._started) {
      clearInterval(this._timer)
      this._started = false
      this.emit('disconnected')
    }
  }
}

module.exports = VerseAgent
