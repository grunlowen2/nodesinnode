'use strict'
const dagMap1 = require('./dagMaps').dagMap1
const dagMap2 = require('./dagMaps').dagMap2
const dagMap3 = require('./dagMaps').dagMap3
const asyncDagProcessor = require('./asyncDagProcessor')
const _ = require('lodash')

const initSimFunctions = function(targetNode, dagMap, simJson) {
  if (!targetNode) { console.log('!! args must be targetNode simMap(optional)'); return }
  if (!dagMap.has(targetNode)) { console.log('!! node not in dag map'); return }
  if (!simJson) {
    var simMsg = ' !! NO SIMULATION !!'
  } else {
    dagMap = modifyDagMapForSim(dagMap, simJson)
    var simMsg = ' !! START SIMULATION !!'
  }
  console.log(`Target node is: ${targetNode} ${simMsg}`)
  asyncDagProcessor.entry(targetNode, dagMap)
}

const modifyDagMapForSim = function(dagMap, simJson) {
  let simMap = new Map(Object.entries(JSON.parse(simJson)))
  for (let [nodeKey, valueObject] of simMap.entries()) {
    //for each property in the sim object, overwrite the matching value in the node object
    let nodeToModify = dagMap.get(nodeKey)
    for (let propertyName in valueObject) {
      nodeToModify[propertyName] = valueObject[propertyName]
    }
  }
  return dagMap
}

const main = function([targetNode, selectedDagMap, simJson]) {
  console.log(targetNode)
  var dagMap
  switch (selectedDagMap) {
    case 'dagMap1': dagMap = dagMap1; break;
    case 'dagMap2': dagMap = dagMap2; break;
    case 'dagMap3': dagMap = new Map([...dagMap1, ...dagMap2, ...dagMap3]); break;
    default: console.log('cmd format is: npm run-script sim targetNode dagMap simJson'); return;
  }
  initSimFunctions(targetNode, dagMap, simJson)
}

//example inputs:
//npm run-script sim 'node_c' dagMap1 '{ "node_e": {"finalValue":-5} }'
//npm run-script sim 'node_r' dagMap3
//npm run-script sim 'node_combo' dagMap3
//npm run-script sim 'node_c' dagMap1 '{ "node_b": { "args":["5"] } }'
//npm run-script sim 'node_lastMap1' dagMap1
main(process.argv.slice(2))
