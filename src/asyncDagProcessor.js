'use strict'
const _ = require('lodash');

//node processor
const np = {
  targetNode: '',
  nodeKeysToProcess: [],
  relationalMap: {},
  finalMap: new Map(),
  startTime: (new Date()).getTime(),

  startNodesWithoutDependencies: (mapOfNodesThatCanBeStartedImmediately) => {
    for (let [nodeKey, nodeProps] of mapOfNodesThatCanBeStartedImmediately) {
      console.log(`!!!! can start node immediately: ${nodeKey}`)
      np.processSingleNode(nodeKey, nodeProps)
    }
  },

  processSingleNode: (nodeKey, nodesProps) => {
    if (nodesProps.finalValue) {
      np.nodeFinishedProcessing(nodeKey, nodesProps.nodesToContact, nodesProps.finalValue)
    } else {
      console.log(`processing node: ${nodeKey}`)
      np.executeNodeFunction(nodesProps.func, nodesProps.args)
          .then((finalValue) => {
            console.log(`result returned, finalValue for ${nodeKey} is: ${finalValue}`)
            np.nodeFinishedProcessing(nodeKey, nodesProps.nodesToContact, finalValue)
          })
          .catch((err) => {
            console.log(`error processing node ${nodeKey} error: ${err}`)
          })
    }
  },

  //this function call might take some time to return
  executeNodeFunction: (funcRef, argsRef) => new Promise((resolve) => resolve(funcRef(...argsRef))),

  nodeFinishedProcessing: (thisNodeKey, nodesToContact, finalValue) => {
    console.log(`completeProcessing, removing nodeKeysToProcess: ${thisNodeKey}`)
    _.remove(np.nodeKeysToProcess, (each) => each === thisNodeKey)
    np.contactNodes(thisNodeKey, nodesToContact, finalValue)
    np.addNodeToFinalMap(thisNodeKey, finalValue)

    if (_.isEmpty(np.nodeKeysToProcess)) { np.logFinalMessage() }
  },

  //loop thru nodesToContact, remove this node from their dependentOnNodes, and if that
  //list is now empty, call the processSingleNode function.
  contactNodes: (thisNodeKey, nodesToContact, finalValue) => {
    for (let eachNodeToContactKey of nodesToContact) {
      let eachNodeToContactValObj = np.relationalMap.get(eachNodeToContactKey)
      let argsOfNodeToContact = eachNodeToContactValObj.args
      console.log(`contacting node: ${eachNodeToContactKey}, replacing arg ${thisNodeKey} with ${finalValue}`)
      argsOfNodeToContact.splice(argsOfNodeToContact.indexOf(thisNodeKey), 1, finalValue)
      //have set the finalValue in other node's args, now remove this node ref from other dependentOnNodes
      _.remove(eachNodeToContactValObj.dependentOnNodes, (each) => each === thisNodeKey)
      np.determineIfOtherNodeCanStart(eachNodeToContactValObj, eachNodeToContactKey)
    }
  },

  determineIfOtherNodeCanStart: (eachNodeToContactValObj, eachNodeToContactKey) => {
    if (eachNodeToContactValObj.dependentOnNodes.length === 0) {
      console.log(`${eachNodeToContactKey} has no more dependencies, so calling init`)
      np.processSingleNode(eachNodeToContactKey, eachNodeToContactValObj)
    }
  },

  addNodeToFinalMap: (nodeKey, finalValue) => {
    np.finalMap.set(nodeKey, finalValue)
  },

  logFinalMessage: () => {
    console.log(`\n ** final map, process time was ${((new Date()).getTime() - np.startTime) / 1000} seconds`)
    console.log(np.finalMap)
    console.log(`'\n ** target node is: ${np.targetNode} its final value is:
          ${np.finalMap.get(np.targetNode)}`)
  }

}

const processDag = (relationalMap, nodeKeysToProcess, targetNode) => {
  let mapOfNodesThatCanBeStartedImmediately = new Map([...relationalMap]
      .filter((mapKeyValAsArray) => mapKeyValAsArray[1].dependentOnNodes && mapKeyValAsArray[1].dependentOnNodes.length === 0))

  //need copy ?? use copy of map in nodesProcessor, because don't want to loop over mutable
  np.relationalMap = relationalMap
  np.nodeKeysToProcess = nodeKeysToProcess
  np.targetNode = targetNode

  np.startNodesWithoutDependencies(mapOfNodesThatCanBeStartedImmediately)
}

//add nodesToContact and dependentNodes to each node in map
const populateDependencies = (relationalMap) => {
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
}

//add the common props to each node
const createRelationalMap = (dagMap, nodeKeysToProcess) => {
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
  populateDependencies(mapCopy)
  return mapCopy
}

//return only relevant connected to targetNode
const determineNodesToProcess = (dagMap, targetNodeKey, setOfNodesToProcess = new Set([])) => {
  if (dagMap.has(targetNodeKey)) { setOfNodesToProcess.add(targetNodeKey) }
  let targetNodeArgs = dagMap.get(targetNodeKey).args
  if (targetNodeArgs) {
    for (let arg of targetNodeArgs) {
      //if the arg is a node, add it to setOfNodesToProcess
      if (dagMap.has(arg)) {
        setOfNodesToProcess.add(arg)
        //recursive for each arg in args list
        determineNodesToProcess(dagMap, arg, setOfNodesToProcess)
      }
    }
  }
  return Array.from(setOfNodesToProcess)
}

exports.entry = (targetNode, dagMap) => {
  if (!targetNode || !dagMap) { console.log('no target node or dag map provided'); return }
  console.log('** raw dag map')
  console.log(dagMap)

  const nodeKeysToProcess = determineNodesToProcess(dagMap, targetNode)
  console.log('\n ** nodeKeysToProcess')
  nodeKeysToProcess.forEach((each, index) => console.log(`${index + 1}: ${each}`))

  const relationalMap = createRelationalMap(dagMap, nodeKeysToProcess)
  console.log('\n ** relational dag map to process')
  console.log(relationalMap)

  processDag(relationalMap, nodeKeysToProcess, targetNode)
}
