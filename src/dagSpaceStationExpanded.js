'use strict'
const customFunctions = require('../shared/customFunctions')
const sleep = require('../shared/common').sleep

const breathable = async ({oxygen, carbon}) => {
  return 145 < oxygen && carbon < 100 }

const survivable = async ({breathable, temperature, radiation}) => {
  console.log('survivable sleeping 1 second')
  await sleep(1000)
  return breathable && 273 < temperature && temperature < 343 && radiation < 100 }

const buildable = async ({breathable, temperature}) => {
  console.log('buildable sleeping 2 seconds')
  await sleep(2000)
  return breathable && temperature > -10 }

const defendable = async ({buildable, shielding, munitions, survivable}) => {
  return buildable && survivable && 200 < shielding * munitions }

const habitable = async ({survivable, water, food}) => {
  return survivable && water && food }

const desireable = async ({desireable, buildable, habitable}) => {
  console.log('desireable sleeping 1 second')
  await sleep(1000)
  return survivable && buildable && habitable }

const dag = new Map()
dag.set('breathable', {'func':breathable, 'args':{'oxygen':'', 'carbon':''}})
dag.set('survivable', {'func':survivable, 'args':{'breathable':'', 'temperature':'', 'radiation':''}})
dag.set('buildable', {'func':buildable, 'args':{'breathable':'', 'temperature':''}})
dag.set('defendable', {'func':defendable, 'args':{'shielding':'', 'buildable':'', 'munitions':'', 'survivable':''}})
dag.set('habitable', {'func':habitable, 'args':{'survivable':'', 'water':'', 'food':''}})
dag.set('desireable', {'func':desireable, 'args':{'survivable':'', 'buildable':'', 'habitable':''}})

exports.dag = dag
