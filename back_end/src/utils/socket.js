const { Server } = require("socket.io");
const http = require('http');

const opts = {
  cors: {
    origin: "*"
  }
};

class Socket {
  io = new Server({
    cors: {
      origin: "*"
    }
  });
  server = http.createServer();
  constructor(app, options) {
    this.server = http.createServer(app);
    this.io = new Server(this.server, {
      ...opts,
      ...options
    });
  };

  listen(port, cb = () => {}) {
    this.server.listen(port, () => {
      console.log('IO listening on', port);
      cb();
    });
  }
}

module.exports = Socket;