const node3sec = async function(someInt) {
  await new Promise(resolve => setTimeout(resolve, 3000))
  const ans = 3 * someInt
  console.log(`returning from p1a exports.node3sec, input was: ${someInt} returning: ${ans}`)
  return ans
}

const node3secArgs = "someInt"
const node3secBody =
  "await new Promise(resolve => setTimeout(resolve, 3000));" +
  "const ans = 3 * someInt;" +
  "console.log(`returning from p1a exports.node3sec, input was: ${someInt} returning: ${ans}`);" +
  "return ans"

const funcToString = (funcArgs, funcBody) => {
  let funcAsJSON = {'args':funcArgs,'body':funcBody}
  return JSON.stringify(funcAsJSON)
}

const stringToFunction = (funcAsString) => {
//  console.log('nodes_p1a functionAsString: ' + funcAsString)
  let funcAsObject = JSON.parse(funcAsString)
  let AsyncFunction = Object.getPrototypeOf(async function(){}).constructor
  return new AsyncFunction(funcAsObject.args, funcAsObject.body)
}

const node3secAsString = funcToString(node3secArgs, node3secBody)

//exports.node3sec = stringToFunction(node3secAsString)
exports.node3sec = node3sec
