'use strict'

const debug = require('debug')('verse:db:setup')
const inquirer = require('inquirer')
const chalk = require('chalk')
const db = require('./')

const prompt = inquirer.createPromptModule()

async function setup () {
  const answer = await prompt([{
    type: 'confirm',
    name: 'setup',
    message: 'This will destroy your database. Are you sure?'
  }])

  if (!answer.setup) {
    return console.log('Nothing happend')
  }

  const config = {
    database: process.env.DB_NAME || 'verse',
    username: process.env.DB_USER || 'verse',
    password: process.env.DB_PASS || 'verse',
    host: process.env.DB_HOST || 'localhost',
    dialect: 'postgres',
    logging: s => debug(s),
    setup: true
  }

  await db(config).catch(handleFatalError)

  console.log('Success')
  process.exit(0)
}

function handleFatalError (error) {
  console.error(`${chalk.red(['fatal error'])} ${error.message}`)
  console.error(error.stack)

  process.exit(1)
}

setup()
