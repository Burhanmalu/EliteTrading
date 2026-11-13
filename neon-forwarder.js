const net = require("net");

// Primary stable AWS us-east-2 IP for Neon
const targetHost = "ep-green-mouse-bd0m0n4p.c-8.us-east-2.aws.neon.tech";
const targetIp = "3.14.138.241";

const server = net.createServer((clientSocket) => {
  const upstream = net.connect({ host: targetIp, port: 5432 });

  clientSocket.pipe(upstream);
  upstream.pipe(clientSocket);

  upstream.on("error", (e) => {
    clientSocket.destroy();
  });
  clientSocket.on("error", (e) => {
    upstream.destroy();
  });
});

const PORT = 5433;
server.listen(PORT, "127.0.0.1", () => {
  console.log(`Neon direct forwarder active on 127.0.0.1:${PORT} -> ${targetIp}:5432`);
});
