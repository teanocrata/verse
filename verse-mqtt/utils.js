'use strict'

const parsePayload = (payload) => {
  const payloadString = payload instanceof Buffer ? payload.toString('utf8') : payload

  try {
    return JSON.parse(payloadString)
  } catch (e) {
    return null
  }
}

module.exports = {parsePayload}
