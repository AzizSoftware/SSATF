require('dotenv').config();

const { startConsumer, disconnectConsumer } = require('./Consumer');
const { validateTransaction } = require('./Validator');
const {
  connectProducer,
  sendEnrichedTransaction,
  disconnectProducer,
} = require('./Producer');

async function main() {
  // Ensure broker is configured
  if (!process.env.KAFKA_BROKER) {
    console.error(" KAFKA_BROKER not defined in .env");
    process.exit(1);
  }

  // Connect to Kafka Producer
  await connectProducer();

  // Define the Kafka consumer message handler
  const messageHandler = async ({ message, partition }) => {
    try {
      const rawValue = message.value?.toString();
      if (!rawValue) {
        console.warn(" Skipped empty message");
        return;
      }

      const transaction = JSON.parse(rawValue);
      console.log(`\n Processing transaction ID: ${transaction.transactionId}`);

      // Validate and enrich transaction
      const { enrichedTransaction, isValid } = validateTransaction(transaction);

      // Log validation result
      console.log(` Validation result: ${isValid ? 'VALID' : 'INVALID'}`);

      // Send enriched transaction to the next Kafka topic
      await sendEnrichedTransaction(enrichedTransaction);
    } catch (err) {
      console.error(' Error in message handler:', err.message);
    }
  };

  // Start Kafka Consumer
  await startConsumer(messageHandler);

  // Graceful shutdown on Ctrl+C
  process.on('SIGINT', async () => {
    console.log('\n Gracefully shutting down...');
    await disconnectConsumer();
    await disconnectProducer();
    process.exit(0);
  });
}

// Start main process
main().catch((err) => {
  console.error(' Fatal error:', err.message);
  process.exit(1);
});
