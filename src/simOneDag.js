'use strict'
const dagMap1 = require('./dagMaps').dagMap1
const dagMap2 = require('./dagMaps').dagMap2
const dagMap3 = require('./dagMaps').dagMap3
const spaceStationDag = require('./dagSpaceStation').spaceStationDag
const asyncOneDagProcessorSetup = require('./asyncOneDagProcessor').setup

const initSimFunctions = (targetNode, dagMap, inputData) => {
  if (!targetNode) { console.log('!! args must be targetNode simMap(optional)'); return }
  if (!dagMap.has(targetNode)) { console.log('!! node not in dag map'); return }
  if (!inputData) { console.log('!! input data required'); return }

  const modifiedDagMap = modifyDagMapWithInputData(dagMap, inputData)
  console.log(`Target node is: ${targetNode}`)
  asyncOneDagProcessorSetup.entry(targetNode, modifiedDagMap, inputData)
}

const modifyDagMapWithInputData = (dagMap, inputData) => {
  let inputMap = new Map(Object.entries(JSON.parse(inputData)))
  console.log(inputMap)
  for (const dagMapObject of dagMap.values()) {
    for (let [inputMapKey, inputMapValue] of inputMap) {
      if (dagMapObject.args.hasOwnProperty(inputMapKey)) {
        dagMapObject.args[inputMapKey] = inputMapValue
      }
    }
  }
  return dagMap
}

const main = function ([targetNode, selectedDagMap, inputData]) {
  var dagMap
  switch (selectedDagMap) {
    case 'dagMap1': dagMap = dagMap1; break;
    case 'dagMap2': dagMap = dagMap2; break;
    case 'spaceStationDag': dagMap = spaceStationDag; console.log(spaceStationDag); break;
    case 'dagMap3': dagMap = new Map([...dagMap1, ...dagMap2, ...dagMap3]); break;
    default: console.log('cmd format is: npm run-script sim targetNode dagMap simJson'); return;
  }
  initSimFunctions(targetNode, dagMap, inputData)
}

exports.main = main
main(process.argv.slice(2))
