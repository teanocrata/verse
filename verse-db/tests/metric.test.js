'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const metricFixtures = require('./fixtures/metric.js')
const agentFixtures = require('./fixtures/agent.js')

let config = {
  logging: function () {}
}

let MetricStub = null
let AgentStub = null

const single = {...agentFixtures.agent}

let agentUuid = 'yyy-yyy-yyy'
let metricType = 'temperature'
let agentUuidCond
let typeAgentUuidCond

const findOneAgentUuidCond = {
  where: { uuid: single.uuid }
}

const newMetric = {
  type: 'velocity',
  value: '30Km/h'
}

const newCreatedMetric = {
  ...newMetric,
  id: 7,
  uuid: 'xxx-xxx-xxx',
  agentId: single.id,
  createdAt: new Date(),
  updatedAt: new Date()
}

let db = null
let sandbox = null

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  MetricStub = {
    belongsTo: sandbox.spy()
  }

  AgentStub = {
    hasMany: sandbox.spy()
  }

  typeAgentUuidCond = {
    attributes: ['id', 'type', 'value', 'createdAt'],
    where: {
      type: metricType
    },
    limit: 20,
    order: [['createdAt', 'DESC']],
    include: [{
      attributes: [],
      model: AgentStub,
      where: {
        uuid: single.uuid
      }
    }],
    raw: true
  }

  agentUuidCond = {
    attributes: ['type'],
    group: ['type'],
    include: [{
      attributes: [],
      model: AgentStub,
      where: {
        uuid: agentUuid
      }
    }],
    raw: true
  }

  // Model findAll MetricStub
  MetricStub.findAll = sandbox.stub()
  MetricStub.findAll.withArgs(agentUuidCond).returns(Promise.resolve(metricFixtures.byAgentUuid(agentUuid)))
  MetricStub.findAll.withArgs(typeAgentUuidCond).returns(Promise.resolve(metricFixtures.byTypeAndAgentUuid(metricType, agentUuid)))

  // Model create MetricStub
  MetricStub.create = sandbox.stub()
  MetricStub.create.returns(Promise.resolve({
    toJSON () { return newCreatedMetric }
  }))

  // Model findOne AgentStub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(findOneAgentUuidCond).returns(Promise.resolve(single))

  const setupDatabase = proxyquire('../', {
    './models/agent': () => AgentStub,
    './models/metric': () => MetricStub
  })
  db = await setupDatabase(config)
})

test.afterEach(() => {
  sandbox && sinon.sandbox.restore()
})

test('Agent', t => {
  t.truthy(db.Metric, 'Metric service should exits')
})

test.serial('Setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Metric#findByAgentUuid', async t => {
  let metrics = await db.Metric.findByAgentUuid(agentUuid)
  t.true(MetricStub.findAll.called, 'findAll should be called on model')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called once')
  t.true(MetricStub.findAll.calledWith(agentUuidCond), 'findAll argument should be agent uuid cond')
  t.deepEqual(metrics, metricFixtures.byAgentUuid(agentUuid), 'should be the same')
})

test.serial('Metric#findByTypeAgentUuid', async t => {
  let metrics = await db.Metric.findByTypeAgentUuid(metricType, single.uuid)
  t.true(MetricStub.findAll.called, 'findAll should be called on model')
  t.true(MetricStub.findAll.calledOnce, 'findAll should be called once')
  t.true(MetricStub.findAll.calledWith(typeAgentUuidCond), 'findAll argument should be type and agent uuid cond')
  t.deepEqual(metrics, metricFixtures.byTypeAndAgentUuid(metricType, agentUuid), 'should be the same')
})

test.serial('Metric#create', async t => {
  let metric = await db.Metric.create(single.uuid, newMetric)
  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledOnce, 'findOne should be called once')
  t.true(AgentStub.findOne.calledWith(findOneAgentUuidCond), 'findOne for Agent should be called whith uuid condition')
  t.true(MetricStub.create.called, 'update should be called on model')
  // t.true(MetricStub.create.calledOnce, 'update should be called once')
  // t.true(MetricStub.create.calledWith({...newMetric, agentId: single.id}), 'update should be called once')
  // t.deepEqual(metric, newCreatedMetric, 'agent should be the same')
})
