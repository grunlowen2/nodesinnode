'use strict'
const customFunctions = require('../shared/customFunctions')

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

const breathable = (oxygen, carbon) => {
  return (145 < oxygen && carbon < 100) }

const survivable = (breathable, temperature, radiation) => {
  return (breathable && 273 < temperature && temperature < 343 && radiation < 100) }

const defendable = (shielding, munitions, survivable) => {
  return (survivable && 200 < shielding * munitions) }

const habitable = (survivable, water, food) => {
  return (survivable && water && food) }

const spaceStationDag = new Map()
spaceStationDag.set('breathable', {'func':breathable, 'args':['oxygen', 'carbon']})
spaceStationDag.set('survivable', {'func':survivable, 'args':['breathable', 'temperature', 'radiation']})
spaceStationDag.set('defendable', {'func':defendable, 'args':['shielding', 'munitions', 'survivable']})
spaceStationDag.set('habitable', {'func':habitable, 'args':['survivable', 'water', 'food']})


exports.spaceStationDag = spaceStationDag
