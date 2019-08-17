const multiplyAll = function() {
  var ans = 1
  for(i=0; i<arguments.length; i++) {
    ans *= arguments[i]
  }
  return ans
}

exports.multiplyAll = multiplyAll
