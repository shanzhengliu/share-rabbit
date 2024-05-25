const { createServer } = require("http");
const { parse } = require("url");
const next = require("next");
const socketIo = require("socket.io");
const dev = process.env.NODE_ENV !== "production";
const hostname = "0.0.0.0";
const port = 3000;
// when using middleware `hostname` and `port` must be provided below
const app = next({ dev, hostname, port });
const handle = app.getRequestHandler();
const liveSockets = {};
const shareIdsBySocket = {};
const fileMetaByShareId = {};
app.prepare().then(() => {
  const server = createServer((req, res) => {
    try {
      const parsedUrl = parse(req.url, true);
      handle(req, res, parsedUrl);
    } catch (err) {
      console.error("Error occurred handling", req.url, err);
      res.statusCode = 500;
      res.end("internal server error");
    }
  });

  const io = socketIo(server);

  io.on("connection", (socket) => {
    liveSockets[socket.id] = socket;

    socket.on("requestOffer", (data) => {
      const { sharedId } = data;
      const socketId = fileMetaByShareId[sharedId].socketId;
      socket.to(socketId).emit("createOffer", { targetSocket: socket.id });
    });

    socket.on("createShare", (data) => {
      shareIdsBySocket[socket.id] = data;
      fileMetaByShareId[data.sharedId] = {
        fileMeta: data.fileMeta,
        socketId: socket.id,
      };
    });

    socket.on("offer", (data) => {
      const { offer, targetSocket } = data;
      socket.to(targetSocket).emit("offer", { offer, targetSocket: socket.id });
    });

    socket.on("fileMeta", (data) => {
      const offerData = fileMetaByShareId[data.sharedId];

      if (offerData) {
        socket.emit("fileMeta", offerData.fileMeta);
      }
    }),
      socket.on("answer", (data) => {
        const { answer, targetSocket } = data;
        io.to(targetSocket).emit("answer", { answer, targetSocket: socket.id });
      });

    socket.on("iceCandidate", (data) => {
      const { candidate, targetSocket } = data;
      data.targetSocket = socket.id;
      io.to(targetSocket).emit("iceCandidate", data);
    });

    socket.on("disconnect", () => {
      delete liveSockets[socket.id];
      const sharedId = shareIdsBySocket[socket.id];
      delete shareIdsBySocket[socket.id];

      if (sharedId) {
        delete fileMetaByShareId[sharedId.sharedId];
      }
    });
  });

  // Start the server
  server.listen(port, hostname, () => {
    console.log(`> Ready on http://${hostname}:${port}`);
  });
});
