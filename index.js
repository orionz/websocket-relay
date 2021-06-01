const express = require('express');
const logger = require('morgan');
const path = require('path');
const ws = require('ws');
const port = 8080

const app = express();

app.use(logger('dev'));

app.use(express.static(path.join(path.resolve(), 'public')));

const connections = {}
const queues = {}

const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', (socket) => {
  let myID =  socket.id
  let peerID = socket.peer

  connections[myID] = socket
  queues[peerID] = []

  socket.on('message', message => { 
    if (connections[peerID]) {
      console.log(`from ${myID} to ${peerID} relay`, message)
      connections[peerID].send(message)
    } else {
      console.log(`from ${myID} to ${peerID} queue`, message)
      queues[peerID].push(message)
    }
  });

  socket.on('close', () => { 
    console.log(`close ${myID}`)
    delete connections[myID]
    delete queues[peerID]
    if (connections[peerID]) {
      connections[peerID].close()
    }
  });

  if (queues[myID]) {
    queues[myID].forEach(message => {
      console.log(`deque :: from ${peerID} to ${myID} queue`, message)
      socket.send(message)
    })
    delete queues[myID]
  }

});

const server = app.listen(port);
console.log(`Express started on port ${port}`);

server.on('upgrade', (request, socket, head) => {
  const url = request.url

  if (!url.startsWith("/connect/")) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }

  let myID = `1:${url}`
  let peerID = `2:${url}`

  if (connections[myID] && connections[peerID]) {
    socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
    socket.destroy();
    return;
  }
  if (connections[myID]) {
    // we are the second one here
     [peerID,myID] = [myID,peerID];
  }
  wsServer.handleUpgrade(request, socket, head, socket => {
    socket.id = myID
    socket.peer = peerID
    wsServer.emit('connection', socket, request);
  });
});

