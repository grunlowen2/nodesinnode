'use strict'
const _ = require('lodash');

const nodesProcessor = {
  targetNode: '',
  nodeKeysToProcess: [],
  relationalMap: {},
  mapOfNodesThatCanBeStartedImmediately: {},
  finalMap: new Map(),
  startTime: (new Date()).getTime(),

  entry_startNodesWithoutDependencies: function() {
    for (let [nodeKey, nodeProps] of this.mapOfNodesThatCanBeStartedImmediately) {
      console.log(`!!!! can start node immediately: ${nodeKey}`)
      this.processSingleNode(nodeKey, nodeProps)
    }
  },

  processSingleNode: function(nodeKey, nodesProps) {
    if (nodesProps.finalValue) {
      this.nodeFinishedProcessing(nodeKey, nodesProps.nodesToContact, nodesProps.finalValue)
    } else {
      console.log(`processing node: ${nodeKey}`)
      this.executeNodeFunction(nodesProps.func, nodesProps.args)
          .then((finalValue) => {
            console.log(`result returned, finalValue for ${nodeKey} is: ${finalValue}`)
            this.nodeFinishedProcessing(nodeKey, nodesProps.nodesToContact, finalValue)
          })
          .catch((err) => {
            console.log('error processing node ' + nodeKey + ' ' + err)
          })
    }
  },

  executeNodeFunction: function(funcRef, argsRef) {
    return new Promise((resolve, reject) => {
      //this function call might take some time to return
      resolve( funcRef(...argsRef) )
    })
  },

  nodeFinishedProcessing: function(thisNodeKey, nodesToContact, finalValue) {
    console.log(`completeProcessing, removing nodeKeysToProcess: ${thisNodeKey}`)
    _.remove(this.nodeKeysToProcess, function(each) { return each == thisNodeKey })
    this.contactNodes(thisNodeKey, nodesToContact, finalValue)
    this.addNodeToFinalMap(thisNodeKey, finalValue)

    if(_.isEmpty(this.nodeKeysToProcess)) { this.logFinalMessage() }
  },

  //loop thru nodesToContact, remove this node from their dependentOnNodes, and if that
  //list is now empty, call the processSingleNode function.
  contactNodes: function(thisNodeKey, nodesToContact, finalValue) {
    for (let eachNodeToContactKey of nodesToContact) {
      let eachNodeToContactValObj = this.relationalMap.get(eachNodeToContactKey)
      let argsOfNodeToContact = eachNodeToContactValObj.args
      console.log(`contacting node: ${eachNodeToContactKey}, replacing arg ${thisNodeKey} with ${finalValue}`)
      argsOfNodeToContact.splice(argsOfNodeToContact.indexOf(thisNodeKey), 1, finalValue)
      //have set the finalValue in other node's args, now remove this node ref from other dependentOnNodes
      _.remove(eachNodeToContactValObj.dependentOnNodes, function(each) { return each == thisNodeKey })
      this.determineIfOtherNodeCanStart(eachNodeToContactValObj, eachNodeToContactKey)
    }
  },

  determineIfOtherNodeCanStart: function(eachNodeToContactValObj, eachNodeToContactKey) {
    if (eachNodeToContactValObj.dependentOnNodes.length === 0) {
      console.log(`${eachNodeToContactKey} has no more dependencies, so calling init`)
      this.processSingleNode(eachNodeToContactKey, eachNodeToContactValObj)
    }
  },

  addNodeToFinalMap: function(nodeKey, finalValue) {
    this.finalMap.set(nodeKey, finalValue)
  },

  logFinalMessage: function() {
    console.log(`\n ** final map, process time was ${((new Date()).getTime() - this.startTime)/1000} seconds`)
    console.log(this.finalMap)
    console.log(`'\n ** target node is: ${this.targetNode} its final value is:
          ${this.finalMap.get(this.targetNode)}`)
  }

}

const processDag = function(relationalMap, nodeKeysToProcess, targetNode) {
  let mapOfNodesThatCanBeStartedImmediately = new Map([...relationalMap]
      .filter((mapKeyValAsArray) => mapKeyValAsArray[1].dependentOnNodes && mapKeyValAsArray[1].dependentOnNodes.length === 0))

  //TODO ?? need copy ?? use copy of map in nodesProcessor, because don't want to loop over mutable
  nodesProcessor.relationalMap = relationalMap
  nodesProcessor.nodeKeysToProcess = nodeKeysToProcess
  nodesProcessor.targetNode = targetNode
  nodesProcessor.mapOfNodesThatCanBeStartedImmediately = mapOfNodesThatCanBeStartedImmediately

  nodesProcessor.entry_startNodesWithoutDependencies()
}

//add nodesToContact and dependentNodes to each node in map
const populateDependencies = function(relationalMap) {
  for (let[nodeKey, nodeProps] of relationalMap) {
    if (nodeProps.hasOwnProperty('finalValue')) continue //can't have dependencies, and other nodes will add themselves to nodesToContact
    for (let targetArg of nodeProps.args) { //iterate over args to find any 'node' references
      //if the map has the node entry, then get it, and add this node to its nodesToContact
      if (relationalMap.has(targetArg)) {
        let otherNode = relationalMap.get(targetArg)
        otherNode.nodesToContact.push(nodeKey)
        //also put in this nodes dependencies
        nodeProps.dependentOnNodes.push(targetArg)
      }
    }
  }
}

//add the common props to each node
const createRelationalMap = function(dagMap, nodeKeysToProcess) {
  //only want a map with nodes contained in nodeKeysToProcess
  const dagMapBasedOnTargetNode = new Map([...dagMap].filter( ([key, val]) => _.includes(nodeKeysToProcess, key)))
  const mapCopy = _.cloneDeep(dagMapBasedOnTargetNode) //otherwise original dagMap would be modified
  for (let [mapKey, mapVal] of mapCopy) {
    //properties to be added to each node for processing
    Object.assign(mapVal, { dependentOnNodes:[], //nodes this node is dependent on
                            nodesToContact:[], //nodes to contact when this node has a finalValue,
                          })
  }
  populateDependencies(mapCopy)
  return mapCopy
}

//return only relevant connected to targetNode
const determineNodesToProcess = function(dagMap, targetNodeKey, setOfNodesToProcess=new Set([])) {
  if (dagMap.has(targetNodeKey)) setOfNodesToProcess.add(targetNodeKey)
  let targetNodeArgs = dagMap.get(targetNodeKey).args
  if (targetNodeArgs) {
    for (let arg of targetNodeArgs) {
      if (dagMap.has(arg)) { //if the arg is a node, add it to setOfNodesToProcess
        setOfNodesToProcess.add(arg)
        determineNodesToProcess(dagMap, arg, setOfNodesToProcess) //recursive for each arg in args list
      }
    }
  }
  return Array.from(setOfNodesToProcess)
}

exports.entry = function(targetNode, dagMap) {
  if(!targetNode || !dagMap) { console.log('no target node or dag map provided'); return }
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
