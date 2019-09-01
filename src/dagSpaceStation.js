'use strict'
const customFunctions = require('../shared/customFunctions')
const sleep = require('../shared/common').sleep

const breathable = async ({oxygen, carbon}) => {
  await sleep(1000)
  return 145 < oxygen && carbon < 100 }

const survivable = async ({breathable, temperature, radiation}) => {
  await sleep(1000)
  return breathable && 273 < temperature && temperature < 343 && radiation < 100 }

const defendable = async ({shielding, munitions, survivable}) => {
  await sleep(1000)
  return survivable && 200 < shielding * munitions }

const habitable = async ({survivable, water, food}) => {
  return survivable && water && food }

const dag = new Map()
dag.set('breathable', {'func':breathable, 'args':{'oxygen':'', 'carbon':''}})
dag.set('survivable', {'func':survivable, 'args':{'breathable':'', 'temperature':'', 'radiation':''}})
dag.set('defendable', {'func':defendable, 'args':{'shielding':'', 'munitions':'', 'survivable':''}})
dag.set('habitable', {'func':habitable, 'args':{'survivable':'', 'water':'', 'food':''}})

const sampleInput = [{
  "oxygen": "160",
  "carbon": "38",
  "temperature": "298",
  "radiation": "0",
  "shielding": "100",
  "munitions": "100",
  "water": true,
  "food": true },
  {
  "oxygen": "160",
  "carbon": "38",
  "temperature": "298",
  "radiation": "0",
  "shielding": "100",
  "munitions": "100",
  "water": false,
  "food": false
  }]

exports.dag = dag
exports.sampleInput = sampleInput
