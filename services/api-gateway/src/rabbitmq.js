const amqp = require('amqplib');

class RabbitMQ {
  constructor() {
    this.connection = null;
    this.channel = null;
  }

  async connect(retries = 5) {
    for (let i = 0; i < retries; i++) {
      try {
        this.connection = await amqp.connect(process.env.RABBITMQ_URL || 'amqp://localhost');
        this.channel = await this.connection.createChannel();
        console.log('Connected to RabbitMQ');
        return;
      } catch (error) {
        console.log(`RabbitMQ connection attempt ${i + 1} failed. Retrying...`);
        await new Promise(resolve => setTimeout(resolve, 5000));
      }
    }
    throw new Error('Failed to connect to RabbitMQ');
  }

  async publishToQueue(queue, message) {
    try {
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.sendToQueue(queue, Buffer.from(JSON.stringify(message)));
    } catch (error) {
      console.error('Error publishing to queue:', error);
    }
  }

  async consumeFromQueue(queue, callback) {
    try {
      await this.channel.assertQueue(queue, { durable: true });
      this.channel.consume(queue, (msg) => {
        if (msg) {
          const content = JSON.parse(msg.content.toString());
          callback(content);
          this.channel.ack(msg);
        }
      });
    } catch (error) {
      console.error('Error consuming from queue:', error);
    }
  }

  async close() {
    if (this.connection) {
      await this.connection.close();
    }
  }
}

module.exports = RabbitMQ;