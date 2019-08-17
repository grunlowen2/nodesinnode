# nodesinnode
Experimenting with how to potentially process dags in Node.js

## Elements
Project consists of the following:
- dagMap.js, which defines dag map examples. Nodes are defined by a key, and either of the following: 1) function reference and arguments (which can be other node keys) OR 2) a final value.
- sim.js, which is the entry point to the app. Takes as arguments the 1) string target node, 2) string dag map to process, 3) (optional) json string of nodes to simulate/overwrite.
- asyncDagProcessor.js, which as the name suggests, process the Dag in an asynchronous manner. That process is:
  - Determine all of the referenced nodes, based on the target node selected.
  - Create a new dag map with those nodes.
  - Add relationship data to each node, in the form of 2 lists, which are 1) other nodes this node is dependent on, and 2) other nodes that depend on this node.
  - Initializing processing by 'starting' any nodes that have no dependencies(logically there has to be at least one).
  - As nodes complete processing they will have a final value. They are removed from the list of nodes to evaluate. The node then has its list of dependent nodes evaluated, and those nodes are updated.
  - If the updated nodes has no other dependencies, they will be 'started'.
  - After all nodes have completed, processing stops and and a map of nodes with their final values is returned.
