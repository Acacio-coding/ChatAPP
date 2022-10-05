import express from "express";
import http from "http";
import path from "path";
import reload from "reload";
import { Server } from "socket.io";

const app = express();
app.use("/public", express.static(path.resolve() + "/src/public"));
reload(app);
const server = http.createServer(app);
const socket = new Server(server);

app.get("/", (req, res) => {
  res.redirect("/login");
});

app.get("/login", (req, res) => {
  res.sendFile(path.resolve() + "/src/views/login.html");
});

app.get("/chat", (req, res) => {
  res.sendFile(path.resolve() + "/src/views/chat.html");
});

export { server, socket };
