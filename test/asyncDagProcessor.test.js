const asyncDagProcessor = require('../src/asyncDagProcessor.js')
const dagMap1 = require('./resources/dagMapsTest').dagMap1
const customFunctions = require('../shared/customFunctions')
const targetNode = 'node_c'
const nodes_p1a = require('./resources/nodes/nodes_p1a')
const nodes_p2a = require('./resources/nodes/nodes_p2a')
const nodes_p3a = require('./resources/nodes/nodes_p3a')

test('determined correct nodes to process', () => {
  const expectedNodesToProcess = ['node_b', 'node_e', 'node_d', 'node_c']
  const nodesToProcess = asyncDagProcessor.setup.determineNodesToProcess(dagMap1, targetNode)
  expect(nodesToProcess.sort()).toEqual(expectedNodesToProcess.sort())
})

test(`check created relational map for dagMap1, target node is ${targetNode}`, () => {
  const nodesToProcess = ['node_b', 'node_d', 'node_e', 'node_c']
  const expectedRelationalMap = new Map()
  expectedRelationalMap.set('node_e', { 'finalValue': 14,'dependentOnNodes': [],'nodesToContact': [ 'node_c', 'node_d' ] })
  expectedRelationalMap.set('node_b', { 'func':nodes_p1a.node3sec,'args': [ 4 ],'dependentOnNodes': [],'nodesToContact': [ 'node_c' ] })
  expectedRelationalMap.set('node_c', { 'func':customFunctions.multiplyAll,'args': [ 3, 'node_d', 5, 'node_e', 'node_b' ],'dependentOnNodes': ['node_d', 'node_e', 'node_b' ],'nodesToContact': [] })
  expectedRelationalMap.set('node_d', { 'func':nodes_p3a.node4sec,'args': [ 'node_e' ],'dependentOnNodes': [ 'node_e' ],'nodesToContact': [ 'node_c' ] })

  const relationalMap = asyncDagProcessor.setup.createRelationalMap(dagMap1, nodesToProcess)
  expect(relationalMap).toEqual(expectedRelationalMap)
})



// const dagMetaData = {}
// dagMetaData.relationalMap = relationalMap
// dagMetaData.nodeKeysToProcess = nodeKeysToProcess
// dagMetaData.targetNode = targetNode
// dagMetaData.mapOfNodesThatCanBeStartedImmediately = mapOfNodesThatCanBeStartedImmediately
// dagMetaData.finalMap = new Map()
