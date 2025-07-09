// producer.js

require('dotenv').config();
const { Kafka } = require('kafkajs');

// Load environment variables
const BROKER = process.env.KAFKA_BROKER;
const CLIENT_ID = process.env.PRODUCER_CLIENT_ID || 'data-processor-producer';
const ENRICHED_TOPIC = process.env.ENRICHED_TOPIC || 'data-enriched-transactions';

// Kafka client instance
const kafka = new Kafka({
  clientId: CLIENT_ID,
  brokers: [BROKER]
});

// Kafka producer instance
const producer = kafka.producer();

// Connect to Kafka broker
const connectProducer = async () => {
  try {
    await producer.connect();
    console.log(' Kafka Producer connected (Data Processor)');
  } catch (error) {
    console.error(' Failed to connect Kafka producer:', error.message);
    process.exit(1);
  }
};

// Send enriched transaction to Kafka topic
const sendEnrichedTransaction = async (enrichedTx) => {
  try {
    const result = await producer.send({
      topic: ENRICHED_TOPIC,
      messages: [
        {
          key: enrichedTx.transactionId?.toString() || null,
          value: JSON.stringify(enrichedTx)
        }
      ]
    });

    console.log(` Sent enriched transaction ${enrichedTx.transactionId} to topic '${ENRICHED_TOPIC}'`);
    return result;
  } catch (error) {
    console.error(' Error sending enriched transaction:', error.message);
  }
};

// Graceful shutdown
const disconnectProducer = async () => {
  try {
    await producer.disconnect();
    console.log(' Kafka Producer disconnected');
  } catch (error) {
    console.error(' Error during producer disconnect:', error.message);
  }
};

module.exports = {
  connectProducer,
  sendEnrichedTransaction,
  disconnectProducer
};
