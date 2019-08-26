const sleep = require('./common').sleep

exports.node2sec = async (someInt, anotherInt) => {
  console.log(`p2a exports.node2sec, inputs are: ${someInt} and ${anotherInt}`)
  await sleep(2000)
  return someInt + anotherInt * 5
}
