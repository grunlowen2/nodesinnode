'use strict'
const nodes_p1a = require('./sample_nodes/nodes_p1a')
const nodes_p2a = require('./sample_nodes/nodes_p2a')
const nodes_p3a = require('./sample_nodes/nodes_p3a')
const customFunctions = require('../shared/customFunctions')

const dagMap1 = new Map()
dagMap1.set('node_e', {'finalValue':14})
dagMap1.set('node_a', {'func':nodes_p2a.node2sec, 'args':['node_b', 'node_c', 5]})
dagMap1.set('node_b', {'func':nodes_p1a.node3sec, 'args':[4]})
dagMap1.set('node_c', {'func':customFunctions.multiplyAll, 'args':[3, 'node_d', 5, 'node_e', 'node_b']})
dagMap1.set('node_lastMap1', {'func':nodes_p3a.nodeDivBy3, 'args':['node_c']}) //multiplyAll.apply(null, [3, 4, 5])
dagMap1.set('node_d', {'func':nodes_p3a.node4sec, 'args':['node_e']})


const dagMap2 = new Map()
dagMap2.set('node_z', {'finalValue':-10})
dagMap2.set('node_y', {'func':nodes_p2a.node2sec, 'args':['node_x', 'node_z', 5]})
dagMap2.set('node_x', {'func':nodes_p1a.node3sec, 'args':[4]})
dagMap2.set('node_w', {'func':customFunctions.multiplyAll, 'args':[3, 'node_v', 5, 'node_x', 'node_y']}) //multiplyAll.apply(null, [3, 4, 5])
dagMap2.set('node_v', {'func':nodes_p1a.node3sec, 'args':['node_x']})
dagMap2.set('node_u', {'func':nodes_p3a.node4sec, 'args':['node_y']})
dagMap2.set('node_t', {'func':nodes_p2a.node2sec, 'args':['node_y', 'node_x', 5]})
dagMap2.set('node_s', {'func':nodes_p3a.node4sec, 'args':[4]})
dagMap2.set('node_r', {'func':customFunctions.multiplyAll, 'args':[3, 'node_u', 5, 'node_q', 'node_t']}) //multiplyAll.apply(null, [3, 4, 5])
dagMap2.set('node_q', {'func':nodes_p1a.node3sec, 'args':['node_s']})


const dagMap3 = new Map()
dagMap3.set('node_combo', {'func':customFunctions.multiplyAll, 'args':['node_r', 'node_a']})

exports.dagMap1 = dagMap1
exports.dagMap2 = dagMap2
exports.dagMap3 = dagMap3
