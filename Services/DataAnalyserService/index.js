require('dotenv').config();

const { startConsumer, disconnectConsumer } = require('./Consumer');
const { validateTransaction } = require('./Validator');
const {
  connectProducer,
  sendEnrichedTransaction,
  disconnectProducer,
} = require('./Producer');

async function main() {
  if (!process.env.KAFKA_BROKER) {
    console.error(" KAFKA_BROKER not defined in .env");
    process.exit(1);
  }

  await connectProducer();

  const messageHandler = async ({ message }) => {
    try {
      const rawValue = message.value?.toString();
      if (!rawValue) return;

      const transaction = JSON.parse(rawValue);
      const { enrichedTransaction } = validateTransaction(transaction);
      await sendEnrichedTransaction(enrichedTransaction);
    } catch (err) {
      console.error(' Error in message handler:', err.message);
    }
  };

  await startConsumer(messageHandler);

  process.on('SIGINT', async () => {
    console.log('\n Gracefully shutting down...');
    await disconnectConsumer();
    await disconnectProducer();
    process.exit(0);
  });
}

main().catch((err) => {
  console.error(' Fatal error:', err.message);
  process.exit(1);
});
