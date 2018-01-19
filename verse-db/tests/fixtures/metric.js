'use strict'

const agentFixtures = require('./agent.js')

const metric = {
  id: 0,
  uuid: 'zzz-zzz-zzz',
  type: 'temperature',
  value: '12ºC',
  agentId: 1,
  createdAt: new Date(),
  updatedAt: new Date()
}

const metrics = [
  metric,
  extend(metric, { id: 1, uuid: 'zzz-zzz-zzw', value: '15ºC' }),
  extend(metric, { id: 2, uuid: 'zzz-zzz-zxz', value: '15%', type: 'humidity' }),
  extend(metric, { id: 3, uuid: 'zzz-zzz-zxw', value: '17%', type: 'humidity' }),
  extend(metric, { id: 4, uuid: 'zzz-zzz-zxy', value: '15%', type: 'humidity' }),
  extend(metric, { id: 5, uuid: 'zzz-zzz-zzx' }),
  extend(metric, { id: 6, uuid: 'zzz-zzz-zzz', value: '75ºF', agentId: 2 })
]

function extend (obj, values) {
  const copy = {...obj, ...values}
  return copy
}

module.exports = {
  metrics,
  byAgentUuid: agentUuid => Array.from(new Set(metrics.filter(a => a.agentId === agentFixtures.byUuid(agentUuid).id).map(a => a.type))).map(type => ({ type })),
  byTypeAndAgentUuid: (type, agentUuid) => metrics.filter(a => ((a.agentId === agentFixtures.byUuid(agentUuid).id) && (a.type === type))).map(a => ({ id: a.id, type: a.type, value: a.value, createdAt: a.createdAt }))
}
