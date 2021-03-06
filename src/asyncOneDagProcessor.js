'use strict'
const _ = require('lodash')
const EventEmitter = require('events');
const logger = require('log4js').getLogger();
logger.level = process.env.NODE_LOG_LEVEL

const entry = (targetNodes, dagMapArray) => {
  logger.debug(`\n ** target nodes \n ${targetNodes}`)
  //assuming dagMapArray has the same keys, otherwise change dagMapArray[0]
  let setOfNodesToProcess = new Set()
  for (let targetNode of targetNodes) {
    let eachTargetNodesToProcess = setup.determineNodesToProcess(dagMapArray[0], targetNode)
    setOfNodesToProcess = new Set([...setOfNodesToProcess, ...eachTargetNodesToProcess])
  }
  const nodeKeysToProcess = Array.from(setOfNodesToProcess)
  logger.debug('\n ** nodeKeysToProcess')
  nodeKeysToProcess.forEach((each, index) => logger.debug(`${index + 1}: ${each}`))

  const nodeProcessorPromises = []
  for (let eachDagMap of dagMapArray) {
   nodeProcessorPromises.push(processEachDataInputSet(nodeKeysToProcess, targetNodes, eachDagMap))
  }
  return Promise.all(nodeProcessorPromises)
}

const processEachDataInputSet = async (nodeKeysToProcess, targetNodes, dagMap) => {
  logger.debug('\n ** raw dag map')
  logger.debug(dagMap)

  const enhancedMap = setup.createEnhancedMap(dagMap, nodeKeysToProcess)
  setup.populateDependencies(enhancedMap)
  logger.debug('\n ** dag map with dependencies')
  logger.debug(enhancedMap)

  const nodesThatCanBeStarted = setup.findNodesThatCanBeStartedImmediately(enhancedMap)
  const dagWithMetaData = setup.createDagWithMetaData(enhancedMap, nodeKeysToProcess, targetNodes, nodesThatCanBeStarted)
  logger.debug('\n ** start processing nodes \n')

  const result = await np.process(dagWithMetaData)
  return result
}

const setup = {

  //return only relevant connected to targetNodes
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
    return setOfNodesToProcess
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

  createDagWithMetaData: (dagMap, nodeKeysToProcess, targetNodes, nodesThatCanBeStarted) => {
    const dagWithMetaData = {}
    dagWithMetaData.dagMap = dagMap
    dagWithMetaData.nodeKeysToProcess = nodeKeysToProcess
    dagWithMetaData.nodesThatCanBeStarted = nodesThatCanBeStarted
    dagWithMetaData.finalResults = {}
    dagWithMetaData.processingDoneEventEmitter = new EventEmitter()
    dagWithMetaData.targetNodes = targetNodes
    return dagWithMetaData
  }

}

//node processor
const np = {

  process: async (dagWithMetaData) => {
    np.startNodes(dagWithMetaData)
    await new Promise((resolve) => dagWithMetaData.processingDoneEventEmitter.once('SINGLE_DAG_COMPLETE', resolve))
    return dagWithMetaData.finalResults
  },

  startNodes: (dagWithMetaData) => {
    for (let [nodeKey, nodeProps] of dagWithMetaData.nodesThatCanBeStarted) {
      logger.debug(`!!!! starting node: ${nodeKey}`)
      np.processSingleNode(nodeKey, nodeProps, dagWithMetaData)
    }
  },

  processSingleNode: (nodeKey, nodeProps, dagWithMetaData) => {
    if (nodeProps.finalValue) {
      np.nodeFinishedProcessing(nodeKey, nodeProps.nodesToContact, nodeProps.finalValue, dagWithMetaData)
    } else {
      logger.debug(`processing node: ${nodeKey}`)
      new Promise((resolve) => resolve(nodeProps.func(nodeProps.args)))
          .then((finalValue) => {
            logger.debug(`result returned, finalValue for ${nodeKey} is: ${finalValue}`)
            np.nodeFinishedProcessing(nodeKey, nodeProps.nodesToContact, finalValue, dagWithMetaData)
          })
          .catch((err) => {
            logger.debug(`error processing node ${nodeKey} error: ${err}`)
          })
    }
  },

  nodeFinishedProcessing: (thisNodeKey, nodesToContact, finalValue, dagWithMetaData) => {
    logger.debug(`completeProcessing, removing nodeKeysToProcess: ${thisNodeKey}`)
    _.remove(dagWithMetaData.nodeKeysToProcess, (each) => each === thisNodeKey)
    np.contactNodes(thisNodeKey, nodesToContact, finalValue, dagWithMetaData)
    np.addNodeTofinalResults(thisNodeKey, finalValue, dagWithMetaData)

    if (_.isEmpty(dagWithMetaData.nodeKeysToProcess)) {
      dagWithMetaData.processingDoneEventEmitter.emit('SINGLE_DAG_COMPLETE')
    }
  },

  //loop thru nodesToContact, remove this node from their dependentOnNodes, and if that
  //list is now empty, call the processSingleNode function.
  contactNodes: (thisNodeKey, nodesToContact, finalValue, dagWithMetaData) => {
    for (let eachNodeToContactKey of nodesToContact) {
      let eachNodeToContactValObj = dagWithMetaData.dagMap.get(eachNodeToContactKey)
      let argsOfNodeToContact = eachNodeToContactValObj.args
      logger.debug(`contacting node: ${eachNodeToContactKey}, replacing arg ${thisNodeKey} with ${finalValue}`)
      argsOfNodeToContact[thisNodeKey] = finalValue
      //have set the finalValue in other node's args, now remove this node ref from other dependentOnNodes
      _.remove(eachNodeToContactValObj.dependentOnNodes, (each) => each === thisNodeKey)
      np.determineIfOtherNodeCanStart(eachNodeToContactValObj, eachNodeToContactKey, dagWithMetaData)
    }
  },

  determineIfOtherNodeCanStart: (eachNodeToContactValObj, eachNodeToContactKey, dagWithMetaData) => {
    if (eachNodeToContactValObj.dependentOnNodes.length === 0) {
      logger.debug(`${eachNodeToContactKey} has no more dependencies, so processing`)
      dagWithMetaData.nodesThatCanBeStarted = new Map()
      dagWithMetaData.nodesThatCanBeStarted.set(eachNodeToContactKey, eachNodeToContactValObj)
      np.startNodes(dagWithMetaData)
    }
  },

  addNodeTofinalResults: (nodeKey, finalValue, dagWithMetaData) => {
    if (dagWithMetaData.targetNodes.includes(nodeKey)) {
      dagWithMetaData.finalResults[nodeKey] = finalValue
    }
  }

}

exports.entry = entry
exports.setup = setup
exports.np = np
