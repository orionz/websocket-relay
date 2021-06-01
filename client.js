const process = require('process');
const WebSocket = require('ws');

const port = 8080
const host = `0.0.0.0:${port}`
const secret = '1234'
const ws = new WebSocket(`ws://${host}/connect/${secret}`);

ws.on('open', function open() {
  ws.send('something');
  let i = 0
  setInterval(() => ws.send('something ' + (i++)),1000)
});

ws.on('message', (data) => {
  console.log(data);
});

ws.on('close', () => {
  console.log("closing");
  process.exit(0)
})
