# Dag nodes in node.js
Experimenting with how to potentially process dags in Node.js

## Project Elements
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
- nodes folder, which contains the node functions used by the dag map. These would be imported from other projects, but as an example are in this project.

## Target concepts to prove out
- Define a dag map in a json format.
- Simulate/overwrite individual nodes.
- Combine dag maps.
- Process nodes not sequentially, but instead as soon as they can be processed.
- Ability to store functions as strings.
- Ability to validate function arguments. (see ow.js)

## Run program
- Clone repo, and cd into
- The command format is:
  - npm run-script sim targetNode dagMap simJson
- Some examples:
  - npm run-script sim 'node_c' dagMap1 '{ "node_e": {"finalValue":-5} }'
  - npm run-script sim 'node_lastMap1' dagMap1
  - npm run-script sim 'node_a' dagMap1 '{ "node_b": { "args":["5"] } }'
  - npm run-script sim 'node_r' dagMap2
  - npm run-script sim 'node_combo' dagMap3
