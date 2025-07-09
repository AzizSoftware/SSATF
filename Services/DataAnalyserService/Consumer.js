const { Kafka } = require('kafkajs');
require('dotenv').config();


//variables
const KAFKA_BROKER=process.env.KAFKA_BROKER;
const CLIENTID=process.env.CLIENTID;
const TOPIC=process.env.TOPIC;
const GROUPID=process.env.GROUPID;


// Kafka configuration
const kafka = new Kafka({
  clientId: CLIENTID,
  brokers: KAFKA_BROKER, 
});

const topic = TOPIC;
const groupId = GROUPID;

const consumer = kafka.consumer({ groupId });

const run = async () => {
  await consumer.connect();
  console.log(`Connected to Kafka broker`);

  await consumer.subscribe({ topic, fromBeginning: true });
  console.log(` Subscribed to topic: ${topic}`);

  await consumer.run({
    eachMessage: async ({ topic, partition, message }) => {
      console.log(`\n Received message`);
      console.log(`Key: ${message.key?.toString()}`);
      console.log(`Value: ${message.value?.toString()}`);
      console.log(`Partition: ${partition} | Offset: ${message.offset}`);
    },
  });
};

// Start the consumer
run().catch((e) => {
  console.error(' Error in consumer:', e.message);
  process.exit(1);
});
