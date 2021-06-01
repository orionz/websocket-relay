const express = require('express');
const logger = require('morgan');
const path = require('path');
const ws = require('ws');
const process = require('process');
const port = process.env.PORT || 8080

const app = express();

app.use(logger('dev'));

app.use(express.static(path.join(path.resolve(), 'public')));

const connections = {}
const queues = {}

const wsServer = new ws.Server({ noServer: true });
wsServer.on('connection', (socket) => {
  let id =  socket.id
  let peer = socket.peer

  connections[id] = socket
  queues[peer] = []

  socket.on('message', message => { 
    if (connections[peer]) {
      //console.log(`from ${id} to ${peer} relay`, message)
      connections[peer].send(message)
    } else {
      //console.log(`from ${id} to ${peer} queue`, message)
      queues[peer].push(message)
    }
  });

  socket.on('close', () => { 
    //console.log(`close ${id}`)
    delete connections[id]
    delete queues[peer]
    if (connections[peer]) {
      connections[peer].close()
    }
  });

  if (queues[id]) {
    queues[id].forEach(message => {
      //console.log(`deque :: from ${peer} to ${id} queue`, message)
      socket.send(message)
    })
    delete queues[id]
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

  let id = `1:${url}`
  let peer = `2:${url}`

  if (connections[id] && connections[peer]) {
    // connection is progress - man in the middle attack?
    socket.write('HTTP/1.1 409 Conflict\r\n\r\n');
    socket.destroy();
    return;
  }
  if (connections[id]) {
    // we are the second one here - reverse
     [peer,id] = [id,peer];
  }
  wsServer.handleUpgrade(request, socket, head, socket => {
    socket.id = id
    socket.peer = peer
    wsServer.emit('connection', socket, request);
  });
});

