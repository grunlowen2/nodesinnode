const http = require('http')
const simOneDag = require('./simOneDag')

http.createServer(async function (req, res) {
  const response = await simOneDag.main(['["habitable", "survivable"]', 'dagSpaceStationExpanded'])
  res.writeHead(200, {'Content-Type': 'text/plain'});
  res.write(`Response: ${JSON.stringify(response)}`);
  res.end();
}).listen(8080);
