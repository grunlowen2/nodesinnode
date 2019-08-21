'use strict'
const dagMap1 = require('./dagMaps').dagMap1
const dagMap2 = require('./dagMaps').dagMap2
const dagMap3 = require('./dagMaps').dagMap3
const asyncDagProcessorSetup = require('./asyncDagProcessor').setup

const initSimFunctions = (targetNode, dagMap, simJson) => {
  if (!targetNode) { console.log('!! args must be targetNode simMap(optional)'); return }
  if (!dagMap.has(targetNode)) { console.log('!! node not in dag map'); return }
  var simMsg = '-- NO SIMULATION --'
  if (simJson) {
    dagMap = modifyDagMapForSim(dagMap, simJson)
    simMsg = '-- START SIMULATION --'
  }
  console.log(`Target node is: ${targetNode} ${simMsg}`)
  asyncDagProcessorSetup.entry(targetNode, dagMap)
}

const modifyDagMapForSim = (dagMap, simJson) => {
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

const main = function ([targetNode, selectedDagMap, simJson]) {
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

exports.main = main
main(process.argv.slice(2))
