const net = require("net");

const targetIp = "3.142.41.151";

const server = net.createServer((clientSocket) => {
  const upstream = net.connect({ host: targetIp, port: 5432 }, () => {
    clientSocket.pipe(upstream);
    upstream.pipe(clientSocket);
  });

  upstream.on("error", () => clientSocket.destroy());
  clientSocket.on("error", () => upstream.destroy());
});

const PORT = 5433;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Neon direct forwarder active on 127.0.0.1:${PORT} -> ${targetIp}:5432`);
});
