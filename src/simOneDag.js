'use strict'
const _ = require('lodash')
const dagSpaceStation = require('./dagSpaceStation')
const dagSpaceStationExpanded = require('./dagSpaceStationExpanded')
const sampleInput = require('./dagSpaceStation').sampleInput
const asyncOneDagProcessorEntry = require('./asyncOneDagProcessor').entry

const main = async function ([targetNodes, dagMapName]) {
  const startTime = (new Date()).getTime()
  console.log(targetNodes)
  if (!targetNodes || !dagMapName) { reportFormatError() }
  let dagMap = selectDagMap(dagMapName)
  const targetNodesArray = JSON.parse(targetNodes)
  const validTargetNodes = targetNodesArray.reduce((all, eachTargetNode) => all && dagMap.has(eachTargetNode), true)
  if (!validTargetNodes) { reportFormatError() }

  const modifiedDagMapArray = []
  for (let eachInputDataObject of sampleInput) {
    modifiedDagMapArray.push(modifyDagMapWithInputData(dagMap, eachInputDataObject))
  }
  const result = await asyncOneDagProcessorEntry(targetNodesArray, modifiedDagMapArray)

  console.log('\n ** final result: ')
  console.log(result)
  console.log(`\n process time was ${((new Date()).getTime() - startTime) / 1000} seconds \n`)
  return result
}

const selectDagMap = (dagMapName) => {
  let dagMap = {}
  switch (dagMapName) {
    case 'dagSpaceStation': dagMap = dagSpaceStation.dag; break;
    case 'dagSpaceStationExpanded': dagMap = dagSpaceStationExpanded.dag; break;
    //case 'dagMap3': dagMap = new Map([...dagMap1, ...dagMap2, ...dagMap3]); break;
    default: reportFormatError();
  }
  return dagMap
}

const modifyDagMapWithInputData = (dagMap, inputDataObject) => {
  //can't modify original, b/c will propigate vals to refs in other maps
  const modifiedDagMap = _.cloneDeep(dagMap)
  const inputMap = new Map(Object.entries(inputDataObject))
  for (const dagMapObject of modifiedDagMap.values()) {
    for (let [inputMapKey, inputMapValue] of inputMap) {
      if (Object.prototype.hasOwnProperty.call(dagMapObject.args, inputMapKey)) {
        dagMapObject.args[inputMapKey] = inputMapValue
      }
    }
  }
  return modifiedDagMap
}

const reportFormatError = () => {
  throw new Error('cmd format is: npm run-script sim targetNodes dagMap simJson')
}

exports.main = main
main(process.argv.slice(2))
