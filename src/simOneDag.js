'use strict'
const _ = require('lodash')
//const dagMap3 = require('./dagMaps').dagMap3
const spaceStationDag = require('./dagSpaceStation').spaceStationDag
const asyncOneDagProcessorEntry = require('./asyncOneDagProcessor').entry

const modifyDagMapWithInputData = (dagMap, inputDataObject) => {
  //can't modify original, b/c will propigate vals to refs in other maps
  const modifiedDagMap = _.cloneDeep(dagMap)
  const inputMap = new Map(Object.entries(inputDataObject))
  for (const dagMapObject of modifiedDagMap.values()) {
    for (let [inputMapKey, inputMapValue] of inputMap) {
      //if (Reflect.apply(Object.prototype.hasOwnProperty, inputMapKey, dagMapObject.args)) {
      if (Object.prototype.hasOwnProperty.call(dagMapObject.args, inputMapKey)) {
        dagMapObject.args[inputMapKey] = inputMapValue
      }
    }
  }
  return modifiedDagMap
}

const selectDagMap = (dagMapName) => {
  let dagMap = {}
  switch (dagMapName) {
    case 'spaceStationDag': dagMap = spaceStationDag; break;
    //case 'dagMap3': dagMap = new Map([...dagMap1, ...dagMap2, ...dagMap3]); break;
    default: reportFormatError();
  }
  return dagMap
}

const reportFormatError = () => {
  throw new Error('cmd format is: npm run-script sim targetNodes dagMap simJson')
}

const main = async function ([targetNodes, dagMapName, inputData]) {
  if (!targetNodes || !dagMapName || !inputData) { reportFormatError() }
  let dagMap = selectDagMap(dagMapName)
  const targetNodesArray = JSON.parse(targetNodes)
  const validTargetNodes = targetNodesArray.reduce((all, eachTargetNode) => all && dagMap.has(eachTargetNode), true)
  if (!validTargetNodes) { reportFormatError() }
  console.log(`\n ** input data \n ${inputData}`)

  const modifiedDagMapArray = []
  const inputDataObject = JSON.parse(inputData)
  for (let eachInputDataObject of inputDataObject) {
    modifiedDagMapArray.push(modifyDagMapWithInputData(dagMap, eachInputDataObject))
  }
  const result = await asyncOneDagProcessorEntry(targetNodesArray, modifiedDagMapArray)

  console.log('\n ** final result: ')
  console.log(result)
  console.log(`\n process time was ${((new Date()).getTime() - startTime) / 1000} seconds \n`)
  return result
}

const startTime = (new Date()).getTime()
exports.main = main
main(process.argv.slice(2))
