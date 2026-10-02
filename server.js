const express = require('express');
const http = require('http');
const { Server } = require('socket.io');

const app = express();
const server = http.createServer(app);
const io = new Server(server);

app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8">
      <title>Real-Time DevOps Chat</title>
      <style>
        body { font-family: Arial, sans-serif; margin: 40px; background: #0f172a; color: #f8fafc; }
        #chat-container { max-width: 600px; margin: 0 auto; background: #1e293b; padding: 20px; border-radius: 8px; }
        #messages { list-style-type: none; padding: 0; max-height: 300px; overflow-y: auto; }
        #messages li { padding: 10px; background: #334155; margin-bottom: 8px; border-radius: 4px; }
        .input-box { display: flex; gap: 10px; margin-top: 20px; }
        input { flex: 1; padding: 10px; border-radius: 4px; border: none; }
        button { padding: 10px 20px; background: #38bdf8; color: #0f172a; font-weight: bold; border: none; border-radius: 4px; cursor: pointer; }
      </style>
    </head>
    <body>
      <div id="chat-container">
        <h2>⚡ Real-Time Socket.IO Kubernetes App</h2>
        <ul id="messages"></ul>
        <div class="input-box">
          <input id="input" autocomplete="off" placeholder="Message likhein..." />
          <button onclick="sendMessage()">Send</button>
        </div>
      </div>

      <script src="/socket.io/socket.io.js"></script>
      <script>
        const socket = io();
        function sendMessage() {
          const input = document.getElementById('input');
          if (input.value) {
            socket.emit('chatMessage', input.value);
            input.value = '';
          }
        }
        socket.on('chatMessage', (msg) => {
          const item = document.createElement('li');
          item.textContent = msg;
          document.getElementById('messages').appendChild(item);
        });
      </script>
    </body>
    </html>
  `);
});

io.on('connection', (socket) => {
  console.log('New WebSocket Client Connected');
  socket.on('chatMessage', (msg) => {
    io.emit('chatMessage', msg);
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});