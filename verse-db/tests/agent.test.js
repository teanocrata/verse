'use strict'

const test = require('ava')
const sinon = require('sinon')
const proxyquire = require('proxyquire')

const agentFixtures = require('./fixtures/agent.js')

let config = {
  logging: function () {}
}

let MetricStub = {
  belongsTo: sinon.spy()
}
let AgentStub = null
let single = {...agentFixtures.agent}
let id = 1
let uuid = 'yyy-yyy-yyy'
let username = 'testagent'
let db = null
let sandbox = null

let uuidArgs = {
  where: {
    uuid
  }
}

let connectedArgs = {
  where: {
    connected: true
  }
}

let usernameArgs = {
  where: {
    username
  }
}

let newAgent = {...single, uuid: 'xxx-xxx-xxx', name: 'newagent'}

test.beforeEach(async () => {
  sandbox = sinon.sandbox.create()
  AgentStub = {
    hasMany: sandbox.spy()
  }
  // Model findById AgentStub
  AgentStub.findById = sandbox.stub()
  AgentStub.findById.withArgs(id).returns(Promise.resolve(agentFixtures.byId(id)))

  // Model findOne AgentStub
  AgentStub.findOne = sandbox.stub()
  AgentStub.findOne.withArgs(uuidArgs).returns(Promise.resolve(agentFixtures.byUuid(uuid)))

  // Model findAll AgentStub
  AgentStub.findAll = sandbox.stub()
  AgentStub.findAll.withArgs().returns(Promise.resolve(agentFixtures.all))
  AgentStub.findAll.withArgs(connectedArgs).returns(Promise.resolve(agentFixtures.connected))

  // Model update AgentStub
  AgentStub.update = sandbox.stub()
  AgentStub.update.withArgs(single, uuidArgs).returns(Promise.resolve(single))

  // Model create AgentStub
  AgentStub.create = sandbox.stub()
  AgentStub.create.withArgs(newAgent).returns(Promise.resolve({
    toJSON () { return newAgent }
  }))

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
  t.truthy(db.Agent, 'Agent service should exits')
})

test.serial('Setup', t => {
  t.true(AgentStub.hasMany.called, 'AgentModel.hasMany was executed')
  t.true(AgentStub.hasMany.calledWith(MetricStub), 'Argument should be the MetricModel')
  t.true(MetricStub.belongsTo.called, 'MetricModel.belongsTo was executed')
  t.true(MetricStub.belongsTo.calledWith(AgentStub), 'Argument should be the AgentModel')
})

test.serial('Agent#findById', async t => {
  let agent = await db.Agent.findById(id)
  t.true(AgentStub.findById.called, 'findById should be called on model')
  t.true(AgentStub.findById.calledOnce, 'findById should be called once')
  t.true(AgentStub.findById.calledWith(id), 'findById argument should be id')
  t.deepEqual(agent, agentFixtures.byId(id), 'should be the same')
})

test.serial('Agent#findByUuid', async t => {
  let agent = await db.Agent.findByUuid(uuid)
  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledOnce, 'findOne should be called once')
  t.true(AgentStub.findOne.calledWith(uuidArgs), 'findByUuid argument should be the query')
  t.deepEqual(agent, agentFixtures.byUuid(uuid), 'should be the same')
})

test.serial('Agent#findAll', async t => {
  let agent = await db.Agent.findAll(uuid)
  t.true(AgentStub.findAll.called, 'findAll should be called on model')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called once')
  t.true(AgentStub.findAll.calledWith(), 'findAll argument should be empty')
  t.deepEqual(agent, agentFixtures.all, 'should be the same')
})

test.serial('Agent#findConnected', async t => {
  let agent = await db.Agent.findConnected(uuid)
  t.true(AgentStub.findAll.called, 'findAll should be called on model')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called once')
  t.true(AgentStub.findAll.calledWith(connectedArgs), 'findAll argument should be empty')
  t.deepEqual(agent, agentFixtures.connected, 'should be the same')
})

test.serial('Agent#findByUsername', async t => {
  let agent = await db.Agent.findByUsername(username)
  t.true(AgentStub.findAll.called, 'findAll should be called on model')
  t.true(AgentStub.findAll.calledOnce, 'findAll should be called once')
  t.true(AgentStub.findAll.calledWith(usernameArgs), 'findAll argument should be empty')
  t.deepEqual(agent, agentFixtures.byUsername(username), 'should be the same')
})

test.serial('Agent#createOrUpdate - exits', async t => {
  let agent = await db.Agent.createOrUpdate(single)
  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledTwice, 'findOne should be called twice')
  t.true(AgentStub.update.called, 'update should be called on model')
  t.true(AgentStub.update.calledOnce, 'update should be called once')
  t.deepEqual(agent, single, 'agent should be the same')
})

test.serial('Agent#createOrUpdate - new', async t => {
  let agent = await db.Agent.createOrUpdate(newAgent)
  t.true(AgentStub.findOne.called, 'findOne should be called on model')
  t.true(AgentStub.findOne.calledOnce, 'findOne should be called once')
  t.true(AgentStub.create.called, 'update should be called on model')
  t.true(AgentStub.create.calledOnce, 'update should be called once')
  t.deepEqual(agent, newAgent, 'agent should be the same')
})
