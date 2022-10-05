import { socket } from "../app.js";
import RabbitMqServer from "./rabbitmq.js";
import { RABBITMQ_URI } from "../utils/constants.js";

socket.on("connection", (client) => {
  const amqp = new RabbitMqServer(RABBITMQ_URI);

  client.on("listen", async (queue) => {
    await amqp.connect();

    await amqp.consume(`users.v1.${queue}`, (payload) => {
      const parsedMessage = JSON.parse(payload.content.toString());

      if (parsedMessage.hasOwnProperty("username")) {
        socket.to(client.id).emit("new-chat", parsedMessage);
      } else if (parsedMessage.hasOwnProperty("participants")) {
        socket.to(client.id).emit("new-group", parsedMessage);
      } else {
        socket.to(client.id).emit("message", parsedMessage);
      }
    });
  });

  client.on("disconnect", async () => {
    await amqp.close();
  });
});
