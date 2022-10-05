import { connect } from "amqplib";

export default class RabbitMqServer {
  connection;
  channel;

  constructor(uri) {}

  async connect() {
    this.connection = await connect(this.uri);
    this.channel = await this.connection.createChannel();
  }

  async consume(queue, callback) {
    return this.channel.consume(queue, (message) => {
      callback(message);
      this.channel.ack(message);
    });
  }

  async close() {
    this.channel.close();
    this.connection.close();
  }
}
