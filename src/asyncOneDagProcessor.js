'use strict'
const _ = require('lodash')
const fs = require('fs')

const sleep = (milliseconds) => {
  return new Promise(resolve => setTimeout(resolve, milliseconds))
}

const entry = async (targetNode, dagMapArray) => {
  const promises = []
  for (let eachDagMap of dagMapArray) {
    promises.push(processEachDataInputSet(targetNode, eachDagMap))
  }
  const resultValues = await Promise.all(promises)
  return resultValues
}

const processEachDataInputSet = async (targetNode, dagMap) => {
  console.log(`\n ** target node \n${targetNode}`)
  console.log('\n ** raw dag map')
  console.log(dagMap)

  const nodeKeysToProcess = setup.determineNodesToProcess(dagMap, targetNode)
  console.log('\n ** nodeKeysToProcess')
  nodeKeysToProcess.forEach((each, index) => console.log(`${index + 1}: ${each}`))

  const enhancedMap = setup.createEnhancedMap(dagMap, nodeKeysToProcess)
  setup.populateDependencies(enhancedMap)
  console.log('\n dag map with dependencies')
  console.log(enhancedMap)

  const nodesThatCanBeStartedImmediately = setup.findNodesThatCanBeStartedImmediately(enhancedMap)
  const dagWithMetaData = setup.createDagWithMetaData(enhancedMap, nodeKeysToProcess, targetNode, nodesThatCanBeStartedImmediately)
  console.log('\n ** start processing nodes \n')
  //return promise
  np.startNodesWithoutDependencies(dagWithMetaData)
  sleep(1000)
  return('bee')
}

const setup = {

  //return only relevant connected to targetNode
  determineNodesToProcess: (dagMap, targetNodeKey, setOfNodesToProcess = new Set([])) => {
    if (dagMap.has(targetNodeKey)) { setOfNodesToProcess.add(targetNodeKey) }
    let targetNodeArgs = dagMap.get(targetNodeKey).args
    if (targetNodeArgs) {
      for (let arg in targetNodeArgs) {
        //if the arg is a node in dagMap, add it to setOfNodesToProcess
        if (dagMap.has(arg)) {
          setOfNodesToProcess.add(arg)
          //recursive for each arg in args list
          setup.determineNodesToProcess(dagMap, arg, setOfNodesToProcess)
        }
      }
    }
    return Array.from(setOfNodesToProcess)
  },

  //add the common props to each node
  createEnhancedMap: (dagMap, nodeKeysToProcess) => {
    //only want a map with nodes contained in nodeKeysToProcess
    const dagMapBasedOnTargetNode = new Map([...dagMap].filter(([key, val]) => _.includes(nodeKeysToProcess, key)))
    //don't want original dagMap to be modified, above 'new Map' still has references to original
    const enhancedMap = _.cloneDeep(dagMapBasedOnTargetNode)
    for (let [mapKey, mapVal] of enhancedMap) {
      //properties to be added to each node are 1) nodes this node is dependent on and 2) nodes to contact when this node has a finalValue.
      Object.assign(mapVal, {
        dependentOnNodes: [],
        nodesToContact: []
      })
     }
    return enhancedMap
  },

  //add nodesToContact and dependentNodes to each node in dag map
  populateDependencies: (dagMap) => {
    for (let [nodeKey, nodeProps] of dagMap) {
      let nodeNeedsToBeProcessed = !Object.prototype.hasOwnProperty.call(nodeProps, 'finalValue')
      if (nodeNeedsToBeProcessed) {
        //iterate over args to find any 'node' references. If node found, add this node to its nodesToContact
        for (let targetArg in nodeProps.args) {
          if (dagMap.has(targetArg)) {
            let otherNode = dagMap.get(targetArg)
            otherNode.nodesToContact.push(nodeKey)
            //also put in this nodes dependencies
            nodeProps.dependentOnNodes.push(targetArg)
          }
        }
      }
    }
  },

  findNodesThatCanBeStartedImmediately: (dagMap) => {
    let nodesThatCanBeStartedImmediately = new Map([...dagMap]
        .filter((mapKeyValAsArray) => mapKeyValAsArray[1].dependentOnNodes && mapKeyValAsArray[1].dependentOnNodes.length === 0))
    return nodesThatCanBeStartedImmediately
  },

  createDagWithMetaData: (dagMap, nodeKeysToProcess, targetNode, nodesThatCanBeStartedImmediately) => {
    const dagWithMetaData = {}
    dagWithMetaData.dagMap = dagMap
    dagWithMetaData.nodeKeysToProcess = nodeKeysToProcess
    dagWithMetaData.targetNode = targetNode
    dagWithMetaData.nodesThatCanBeStartedImmediately = nodesThatCanBeStartedImmediately
    dagWithMetaData.finalMap = {}
    return dagWithMetaData
  }

}

//node processor
const np = {

  startNodesWithoutDependencies: (dagWithMetaData) => {
    for (let [nodeKey, nodeProps] of dagWithMetaData.nodesThatCanBeStartedImmediately) {
      console.log(`!!!! can start node immediately: ${nodeKey}`)
      np.processSingleNode(nodeKey, nodeProps, dagWithMetaData)
    }
  },

  processSingleNode: (nodeKey, nodeProps, dagWithMetaData) => {
    if (nodeProps.finalValue) {
      np.nodeFinishedProcessing(nodeKey, nodeProps.nodesToContact, nodeProps.finalValue, dagWithMetaData)
    } else {
      console.log(`processing node: ${nodeKey}`)
      new Promise((resolve) => resolve(nodeProps.func(nodeProps.args)))
          .then((finalValue) => {
            console.log(`result returned, finalValue for ${nodeKey} is: ${finalValue}`)
            np.nodeFinishedProcessing(nodeKey, nodeProps.nodesToContact, finalValue, dagWithMetaData)
          })
          .catch((err) => {
            console.log(`error processing node ${nodeKey} error: ${err}`)
          })
    }
  },

  nodeFinishedProcessing: (thisNodeKey, nodesToContact, finalValue, dagWithMetaData) => {
    console.log(`completeProcessing, removing nodeKeysToProcess: ${thisNodeKey}`)
    _.remove(dagWithMetaData.nodeKeysToProcess, (each) => each === thisNodeKey)
    np.contactNodes(thisNodeKey, nodesToContact, finalValue, dagWithMetaData)
    np.addNodeToFinalMap(thisNodeKey, finalValue, dagWithMetaData)

    if (_.isEmpty(dagWithMetaData.nodeKeysToProcess)) { np.publishResults(dagWithMetaData) }
  },

  //loop thru nodesToContact, remove this node from their dependentOnNodes, and if that
  //list is now empty, call the processSingleNode function.
  contactNodes: (thisNodeKey, nodesToContact, finalValue, dagWithMetaData) => {
    for (let eachNodeToContactKey of nodesToContact) {
      let eachNodeToContactValObj = dagWithMetaData.dagMap.get(eachNodeToContactKey)
      let argsOfNodeToContact = eachNodeToContactValObj.args
      console.log(`contacting node: ${eachNodeToContactKey}, replacing arg ${thisNodeKey} with ${finalValue}`)
      argsOfNodeToContact[thisNodeKey] = finalValue
      //have set the finalValue in other node's args, now remove this node ref from other dependentOnNodes
      _.remove(eachNodeToContactValObj.dependentOnNodes, (each) => each === thisNodeKey)
      np.determineIfOtherNodeCanStart(eachNodeToContactValObj, eachNodeToContactKey, dagWithMetaData)
    }
  },

  determineIfOtherNodeCanStart: (eachNodeToContactValObj, eachNodeToContactKey, dagWithMetaData) => {
    if (eachNodeToContactValObj.dependentOnNodes.length === 0) {
      console.log(`${eachNodeToContactKey} has no more dependencies, so calling init`)
      np.processSingleNode(eachNodeToContactKey, eachNodeToContactValObj, dagWithMetaData)
    }
  },

  addNodeToFinalMap: (nodeKey, finalValue, dagWithMetaData) => {
    dagWithMetaData.finalMap[nodeKey] = String(finalValue)
  },

  //api call or whatever
  publishResults: (dagWithMetaData) => {
    const processTimeMsg = `\n ** final results map, process time was ${((new Date()).getTime() - startTime) / 1000} seconds \n`
    const finalNodeMsg = `'\n ** target node is: ${dagWithMetaData.targetNode} its final value is:
          ${dagWithMetaData.finalMap[dagWithMetaData.targetNode]}`
    const stream = fs.createWriteStream('./dagResults.txt')
    stream.once('open', () => {
      stream.write(processTimeMsg)
      stream.write(JSON.stringify(dagWithMetaData.finalMap))
      stream.write(finalNodeMsg)
      stream.end()
    })
    console.log(processTimeMsg)
    console.log(dagWithMetaData.finalMap)
    console.log(finalNodeMsg)
  }

}

const startTime = (new Date()).getTime()

exports.entry = entry
exports.setup = setup
exports.np = np
