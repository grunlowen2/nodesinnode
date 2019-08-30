'use strict'
const dagMap3 = require('./dagMaps').dagMap3
const spaceStationDag = require('./dagSpaceStation').spaceStationDag
const asyncOneDagProcessor_entry = require('./asyncOneDagProcessor').entry

const modifyDagMapWithInputData = (dagMap, inputDataObject) => {
  let inputMap = new Map(Object.entries(inputDataObject))
  for (const dagMapObject of dagMap.values()) {
    for (let [inputMapKey, inputMapValue] of inputMap) {
      if (dagMapObject.args.hasOwnProperty(inputMapKey)) {
        dagMapObject.args[inputMapKey] = inputMapValue
      }
    }
  }
  return dagMap
}

const selectDagMap = (dagMapName) => {
  let dagMap = {}
  switch (dagMapName) {
    case 'spaceStationDag': dagMap = spaceStationDag; break;
    case 'dagMap3': dagMap = new Map([...dagMap1, ...dagMap2, ...dagMap3]); break;
    default: return;
  }
  return dagMap
}

const reportFormatError = () => {
  console.error('cmd format is: npm run-script sim targetNode dagMap simJson')
}

const main = async function ([targetNode, dagMapName, inputData]) {
  if (!targetNode || !dagMapName || !inputData) { reportFormatError(); return; }
  let dagMap = selectDagMap(dagMapName)
  if (!dagMap) { reportFormatError(); return; }
  if (!dagMap.has(targetNode)) { console.error('!! target node not in dag map'); return }
  console.log('** input data')
  console.log(inputData)

  const modifiedDagMapArray = []
  const inputDataObject = JSON.parse(inputData)
  for (let eachInputDataObject of inputDataObject) {
    var modifiedDagMap = modifyDagMapWithInputData(dagMap, eachInputDataObject)
    modifiedDagMapArray.push(modifiedDagMap)
  }
  let result = await asyncOneDagProcessor_entry(targetNode, modifiedDagMapArray, inputData)
  console.log('** final result: ')
  console.log(result)
  return result
}

exports.main = main
main(process.argv.slice(2))
