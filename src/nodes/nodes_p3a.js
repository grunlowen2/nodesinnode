const sleep = require('../../shared/common').sleep

exports.nodeDivBy3 = (someInt) => {
  rem = someInt % 3
  switch(rem) {
    case 0:
      return `This input is divisible by 3: ${someInt}`
    case 1:
      return `Not divisible by 3: ${someInt}`
    case 1:
      return `Plus 1 would be divisible by 3: ${someInt}`
    default:
      return `Bad input: ${someInt}`
  }
}

exports.node4 = (someInt) => {
  return someInt * 11
}

exports.node4sec = async (input) => {
  console.log(`p3a exports.node4sec, input is: ${input}`)
  await sleep(4000)
  return input + 123
}
