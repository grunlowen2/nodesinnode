'use strict'
const customFunctions = require('../shared/customFunctions')
const sleep = require('../shared/common').sleep

//put in another file
const input = [{
  "oxygen": "160",
  "carbon": "38",
  "temperature": "298",
  "radiation": "0",
  "shielding": "100",
  "munitions": "100",
  "water": "true",
  "food": "true" },
  {
  "oxygen": "160",
  "carbon": "38",
  "temperature": "298",
  "radiation": "0",
  "shielding": "100",
  "munitions": "100",
  "water": "false",
  "food": "false"
  }]

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

const spaceStationDag = new Map()
spaceStationDag.set('breathable', {'func':breathable, 'args':{'oxygen':'', 'carbon':''}})
spaceStationDag.set('survivable', {'func':survivable, 'args':{'breathable':'', 'temperature':'', 'radiation':''}})
spaceStationDag.set('defendable', {'func':defendable, 'args':{'shielding':'', 'munitions':'', 'survivable':''}})
spaceStationDag.set('habitable', {'func':habitable, 'args':{'survivable':'', 'water':'', 'food':''}})


exports.spaceStationDag = spaceStationDag

// [{:survivable true, :shielding 100, :carbon 38, :habitable true, :radiation 0, :food true, :munitions 100, :defendable true, :breathable true, :oxygen 160, :water true, :temperature 298}]
