const nodes_p1a = require('./nodes_p1a')
const nodes_p2a = require('./nodes_p2a')
const nodes_p3a = require('./nodes_p3a')

//establish order in which to process nodes
const findOrder = (node, dagMap) => {
  let keysInProcessOrder = []
  let inner = function(node, dagMap, keysInProcessOrder) {
    keysInProcessOrder.push(node)
    targetEntry = dagMap.get(node)
    let args = targetEntry['args']
    //ensure args exist and are iterable
    if (args === undefined || args === null || !(typeof args[Symbol.iterator]) === 'function') return
    for (let item of args) {
      //console.log('item is: ' + item + ' dagMap has item: ' + dagMap.has(item))
      if (typeof item === 'string' && dagMap.has(item)) {
        inner(item, dagMap, keysInProcessOrder) //recursive call if item is a node in dagMap
      }
    }
  }
  inner(node, dagMap, keysInProcessOrder)
  return keysInProcessOrder
}

const orderAndFilterKeys = keysInProcessOrder => {
  //now have all nodes, so reverse order to get first needed to evaluate
  keysInProcessOrder.reverse()
  //and then filter out any dupes. Don't initially, as we need the last reference to each, which is first to be evaluated.
  orderedAndFilteredKeys = keysInProcessOrder.filter((each, i) => keysInProcessOrder.indexOf(each) == i)
  return orderedAndFilteredKeys
}

const processDagMap = function(orderedAndFilteredKeys, dagMap) {
  let processedDagMap = new Map()
  for (let key of orderedAndFilteredKeys) {
    let nodeObj = dagMap.get(key)
    //if a 'value' node, then get value and continue loop
    if (nodeObj.hasOwnProperty('value')) {
      processedDagMap.set(key, nodeObj['value'])
      continue
    }
    let args = nodeObj['args']
    let processedArgs = []
    if (args !== undefined && args !== null && (typeof args[Symbol.iterator]) === 'function') {
      for (let item of args) {
        let val = ''
        if (typeof item === 'string' && processedDagMap.has(item)) {
          val = processedDagMap.get(item)
        } else {
          val = item
        }
        processedArgs.push(val)
      }
    }
    //console.log('processedArgs ' + processedArgs)
    const res = (nodeObj['func']).apply(null, processedArgs)
    //console.log(res)
    processedDagMap.set(key, res)
  }
  return processedDagMap
}

const initProcessing = function(targetNode, dagMap) {
  let keysInProcessOrder = findOrder(targetNode, dagMap)
  let orderedAndFilteredKeys = orderAndFilterKeys(keysInProcessOrder)
  console.log('keysInProcessOrder: ' + orderedAndFilteredKeys)
  //order is established, now build processed map with values
  let processedDagMap = processDagMap(orderedAndFilteredKeys, dagMap)
  for (var [key, value] of processedDagMap.entries()) {
    console.log('processedDagMap key: ' + key + ' value: ' + value)
  }
  console.log('result from target node is: ' + processedDagMap.get(targetNode))
}

exports.findOrder = findOrder
exports.orderAndFilterKeys = orderAndFilterKeys
exports.processDagMap = processDagMap
exports.initProcessing = initProcessing
