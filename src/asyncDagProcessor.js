'use strict'
const _ = require('lodash')
const fs = require('fs')

//node processor
const np = {

  startNodesWithoutDependencies: (dagMetaData) => {
    for (let [nodeKey, nodeProps] of dagMetaData.mapOfNodesThatCanBeStartedImmediately) {
      console.log(`!!!! can start node immediately: ${nodeKey}`)
      np.processSingleNode(nodeKey, nodeProps, dagMetaData)
    }
  },

  processSingleNode: (nodeKey, nodesProps, dagMetaData) => {
    if (nodesProps.finalValue) {
      np.nodeFinishedProcessing(nodeKey, nodesProps.nodesToContact, nodesProps.finalValue, dagMetaData)
    } else {
      console.log(`processing node: ${nodeKey}`)
      np.executeNodeFunction(nodesProps.func, nodesProps.args)
          .then((finalValue) => {
            console.log(`result returned, finalValue for ${nodeKey} is: ${finalValue}`)
            np.nodeFinishedProcessing(nodeKey, nodesProps.nodesToContact, finalValue, dagMetaData)
          })
          .catch((err) => {
            console.log(`error processing node ${nodeKey} error: ${err}`)
          })
    }
  },

  //this function call might take some time to return
  executeNodeFunction: (funcRef, argsRef) => new Promise((resolve) => resolve(funcRef(...argsRef))),

  nodeFinishedProcessing: (thisNodeKey, nodesToContact, finalValue, dagMetaData) => {
    console.log(`completeProcessing, removing nodeKeysToProcess: ${thisNodeKey}`)
    _.remove(dagMetaData.nodeKeysToProcess, (each) => each === thisNodeKey)
    np.contactNodes(thisNodeKey, nodesToContact, finalValue, dagMetaData)
    np.addNodeToFinalMap(thisNodeKey, finalValue, dagMetaData)

    if (_.isEmpty(dagMetaData.nodeKeysToProcess)) { np.publishResults(dagMetaData) }
  },

  //loop thru nodesToContact, remove this node from their dependentOnNodes, and if that
  //list is now empty, call the processSingleNode function.
  contactNodes: (thisNodeKey, nodesToContact, finalValue, dagMetaData) => {
    for (let eachNodeToContactKey of nodesToContact) {
      let eachNodeToContactValObj = dagMetaData.relationalMap.get(eachNodeToContactKey)
      let argsOfNodeToContact = eachNodeToContactValObj.args
      console.log(`contacting node: ${eachNodeToContactKey}, replacing arg ${thisNodeKey} with ${finalValue}`)
      argsOfNodeToContact.splice(argsOfNodeToContact.indexOf(thisNodeKey), 1, finalValue)
      //have set the finalValue in other node's args, now remove this node ref from other dependentOnNodes
      _.remove(eachNodeToContactValObj.dependentOnNodes, (each) => each === thisNodeKey)
      np.determineIfOtherNodeCanStart(eachNodeToContactValObj, eachNodeToContactKey, dagMetaData)
    }
  },

  determineIfOtherNodeCanStart: (eachNodeToContactValObj, eachNodeToContactKey, dagMetaData) => {
    if (eachNodeToContactValObj.dependentOnNodes.length === 0) {
      console.log(`${eachNodeToContactKey} has no more dependencies, so calling init`)
      np.processSingleNode(eachNodeToContactKey, eachNodeToContactValObj, dagMetaData)
    }
  },

  addNodeToFinalMap: (nodeKey, finalValue, dagMetaData) => {
    dagMetaData.finalMap.set(nodeKey, finalValue)
  },

  //api call or whatever
  publishResults: (dagMetaData) => {
    const processTimeMsg = `\n ** final map, process time was ${((new Date()).getTime() - startTime) / 1000} seconds \n`
    const finalNodeMsg = `'\n ** target node is: ${dagMetaData.targetNode} its final value is:
          ${dagMetaData.finalMap.get(dagMetaData.targetNode)}`
    const stream = fs.createWriteStream('./dagResults.txt')
    stream.once('open', () => {
      stream.write(processTimeMsg)
      stream.write(JSON.stringify([...dagMetaData.finalMap]))
      stream.write(finalNodeMsg)
      stream.end()
    })
    console.log(processTimeMsg)
    console.log(dagMetaData.finalMap)
    console.log(finalNodeMsg)
  }

}

const setup = {
  processDag: (relationalMap, nodeKeysToProcess, targetNode) => {
    let mapOfNodesThatCanBeStartedImmediately = new Map([...relationalMap]
        .filter((mapKeyValAsArray) => mapKeyValAsArray[1].dependentOnNodes && mapKeyValAsArray[1].dependentOnNodes.length === 0))

    //need copy ?? use copy of map in nodesProcessor, because don't want to loop over mutable
    const dagMetaData = {}
    dagMetaData.relationalMap = relationalMap
    dagMetaData.nodeKeysToProcess = nodeKeysToProcess
    dagMetaData.targetNode = targetNode
    dagMetaData.mapOfNodesThatCanBeStartedImmediately = mapOfNodesThatCanBeStartedImmediately
    dagMetaData.finalMap = new Map()
    np.startNodesWithoutDependencies(dagMetaData)
  },

  //add nodesToContact and dependentNodes to each node in map
  populateDependencies: (relationalMap) => {
    for (let [nodeKey, nodeProps] of relationalMap) {
      //can't have dependencies, and other nodes will add themselves to nodesToContact
      if (!Object.prototype.hasOwnProperty.call(nodeProps, 'finalValue')) {
      //iterate over args to find any 'node' references if the map has the node entry, then get it, and add this node to its nodesToContact
        for (let targetArg of nodeProps.args) {
          if (relationalMap.has(targetArg)) {
            let otherNode = relationalMap.get(targetArg)
            otherNode.nodesToContact.push(nodeKey)
            //also put in this nodes dependencies
            nodeProps.dependentOnNodes.push(targetArg)
          }
        }
      }
    }
  },

  //add the common props to each node
  createRelationalMap: (dagMap, nodeKeysToProcess) => {
    //only want a map with nodes contained in nodeKeysToProcess
    const dagMapBasedOnTargetNode = new Map([...dagMap].filter(([key, val]) => _.includes(nodeKeysToProcess, key)))
    //don't want original dagMap to be modified
    const mapCopy = _.cloneDeep(dagMapBasedOnTargetNode)
    for (let [mapKey, mapVal] of mapCopy) {
      //properties to be added to each node are 1) nodes this node is dependent on and 2) nodes to contact when this node has a finalValue.
      Object.assign(mapVal, {
        dependentOnNodes: [],
        nodesToContact: []
      })
     }
    setup.populateDependencies(mapCopy)
    return mapCopy
  },

  //return only relevant connected to targetNode
  determineNodesToProcess: (dagMap, targetNodeKey, setOfNodesToProcess = new Set([])) => {
    if (dagMap.has(targetNodeKey)) { setOfNodesToProcess.add(targetNodeKey) }
    let targetNodeArgs = dagMap.get(targetNodeKey).args
    if (targetNodeArgs) {
      for (let arg of targetNodeArgs) {
        //if the arg is a node, add it to setOfNodesToProcess
        if (dagMap.has(arg)) {
          setOfNodesToProcess.add(arg)
          //recursive for each arg in args list
          setup.determineNodesToProcess(dagMap, arg, setOfNodesToProcess)
        }
      }
    }
    return Array.from(setOfNodesToProcess)
  },

  entry: (targetNode, dagMap) => {
    if (!targetNode || !dagMap) { console.log('no target node or dag map provided'); return }
    console.log('** raw dag map')
    console.log(dagMap)

    const nodeKeysToProcess = setup.determineNodesToProcess(dagMap, targetNode)
    console.log('\n ** nodeKeysToProcess')
    nodeKeysToProcess.forEach((each, index) => console.log(`${index + 1}: ${each}`))

    const relationalMap = setup.createRelationalMap(dagMap, nodeKeysToProcess)
    console.log('\n ** relational dag map to process')
    console.log(relationalMap)

    setup.processDag(relationalMap, nodeKeysToProcess, targetNode)
  }
}

const startTime = (new Date()).getTime()

exports.setup = setup
exports.np = np
