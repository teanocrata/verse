'use strict'

module.exports = function setupAgent (AgentModel) {
  function findById (id) {
    return AgentModel.findById(id)
  }

  function findByUuid (uuid) {
    const cond = {
      where: {
        uuid
      }
    }
    return AgentModel.findOne(cond)
  }

  function findAll () {
    return AgentModel.findAll()
  }

  function findConnected (id) {
    const cond = {
      where: {
        connected: true
      }
    }
    return AgentModel.findAll(cond)
  }

  function findByUsername (username) {
    const cond = {
      where: {
        username
      }
    }
    return AgentModel.findAll(cond)
  }

  async function createOrUpdate (agent) {
    const cond = {
      where: {
        uuid: agent.uuid
      }
    }

    const existingAgent = await AgentModel.findOne(cond)

    if (existingAgent) {
      const updated = await AgentModel.update(agent, cond)
      return updated ? AgentModel.findOne(cond) : existingAgent
    }

    const result = await AgentModel.create(agent)
    return result.toJSON()
  }
  return { findById, findByUuid, findAll, findConnected, findByUsername, createOrUpdate }
}
