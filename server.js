const { createServer } = require('node:http');
const { Server } = require('socket.io');
const fs = require('node:fs');
const path = require('node:path');

const httpServer = createServer((req, res) => {
  let filePath = path.join(__dirname, 'index.html');
if (!fs.existsSync(filePath)) filePath = path.join(__dirname, 'Index.html');
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(500, { 'Content-Type': 'text/plain; charset=utf-8' });
      return res.end('Ошибка загрузки игры');
    }
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8' });
    res.end(data);
  });
});

const io = new Server(httpServer, { cors: { origin: '*' } });

const online = new Map();

io.on('connection', (socket) => {
  console.log('Подключился:', socket.id);

  socket.on('join', (nickname) => {
    const nick = (nickname || 'Игрок').toString().slice(0, 20);
    online.set(socket.id, nick);
    io.emit('system', nick + ' зашёл в Зону');
    io.emit('online', online.size);
    socket.emit('welcome', 'Добро пожаловать, ' + nick + '!');
  });

  socket.on('chat message', (msg) => {
    const nick = online.get(socket.id) || 'Аноним';
    const text = (msg || '').toString().slice(0, 300).trim();
    if (!text) return;
    io.emit('chat message', { nick: nick, text: text, time: Date.now() });
  });

  socket.on('disconnect', () => {
    const nick = online.get(socket.id);
    if (nick) {
      online.delete(socket.id);
      io.emit('system', nick + ' покинул Зону');
      io.emit('online', online.size);
    }
  });
});

const PORT = process.env.PORT || 3000;
httpServer.listen(PORT, () => {
  console.log('Сервер чата запущен на порту ' + PORT);
});
