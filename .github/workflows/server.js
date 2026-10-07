const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const { createClient } = require('redis');
const { createAdapter } = require('@socket.io/redis-adapter');
const promClient = require('prom-client');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

// Prometheus Setup
const register = new promClient.Registry();
promClient.collectDefaultMetrics({ register });
const activeConnectionsGauge = new promClient.Gauge({
  name: 'socket_io_active_connections',
  help: 'Number of active Socket.IO connections',
});
register.registerMetric(activeConnectionsGauge);

// Root Route - Serves HTML test page directly
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html>
    <head>
      <title>Socket.IO Redis Test</title>
      <script src="/socket.io/socket.io.js"></script>
      <style>
        body { font-family: Arial, sans-serif; margin: 30px; }
        #messages { list-style-type: none; padding: 0; }
        #messages li { padding: 8px 12px; margin-bottom: 6px; background: #eef2f5; border-radius: 4px; }
        input { padding: 8px; width: 250px; }
        button { padding: 8px 15px; }
      </style>
    </head>
    <body>
      <h2>Socket.IO Multi-Pod Redis Test</h2>
      <p>Connected to Pod: <strong>${process.env.HOSTNAME || 'local'}</strong></p>
      <input id="input" autocomplete="off" placeholder="Type a message..." />
      <button onclick="sendMessage()">Send</button>
      <ul id="messages"></ul>

      <script>
        const socket = io();
        socket.on('message', (msg) => {
          const item = document.createElement('li');
          item.textContent = \`[\${msg.pod}]: \${msg.data}\`;
          document.getElementById('messages').appendChild(item);
        });

        function sendMessage() {
          const input = document.getElementById('input');
          if (input.value) {
            socket.emit('message', input.value);
            input.value = '';
          }
        }
      </script>
    </body>
    </html>
  `);
});

// Metrics Endpoint
app.get('/metrics', async (req, res) => {
  res.set('Content-Type', register.contentType);
  res.end(await register.metrics());
});

// Redis Adapter Configuration
const REDIS_HOST = process.env.REDIS_HOST || 'localhost';
const REDIS_PORT = process.env.REDIS_PORT || 6379;

const pubClient = createClient({ url: `redis://${REDIS_HOST}:${REDIS_PORT}` });
const subClient = pubClient.duplicate();

Promise.all([pubClient.connect(), subClient.connect()]).then(() => {
  io.adapter(createAdapter(pubClient, subClient));
  console.log('Connected to Redis Adapter successfully');
}).catch((err) => {
  console.error('Redis connection error:', err);
});

// Socket.IO Logic
io.on('connection', (socket) => {
  activeConnectionsGauge.inc();
  console.log(`User connected to Pod: ${process.env.HOSTNAME || 'local'}`);

  socket.on('message', (data) => {
    io.emit('message', { data, pod: process.env.HOSTNAME });
  });

  socket.on('disconnect', () => {
    activeConnectionsGauge.dec();
    console.log('User disconnected');
  });
});

server.listen(3000, () => {
  console.log('Server running on port 3000');
});