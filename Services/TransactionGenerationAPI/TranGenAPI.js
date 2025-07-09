
require('dotenv').config();

const express = require('express');
const { MongoClient } = require('mongodb');
const { Kafka } = require('kafkajs');

const app = express();


const PORT = process.env.PORT || 3000;
const MONGO_URI = process.env.MONGODB_URI;
const DATABASE_NAME = process.env.DATABASE_NAME;
const COLLECTION_NAME = process.env.COLLECTION_NAME;
const KAFKA_BROKER = process.env.KAFKA_BROKER;

// Validate MongoDB URI
if (!MONGO_URI) {
    console.error(" MongoDB URI is not configured correctly in the .env file");
    process.exit(1);
}

let mongoClient;
let db;

// Connect to MongoDB
async function connectToMongoDB() {
    try {
        mongoClient = new MongoClient(MONGO_URI, {});
        await mongoClient.connect();
        db = mongoClient.db(DATABASE_NAME);
        console.log(" Connected successfully to MongoDB");
        console.log(` Using database: ${db.databaseName}`);
    } catch (error) {
        console.error(" MongoDB connection failed:", error.message);
        process.exit(1);
    }
}

// Kafka Producer Configuration

const kafka = new Kafka({
    clientId: 'transaction-generator',
    brokers: [KAFKA_BROKER] 
});

const producer = kafka.producer();

// Connect to Kafka
async function connectKafkaProducer() {
    try {
        await producer.connect();
        console.log(' Kafka Producer connected successfully!');
    } catch (error) {
        console.error(' Kafka Producer connection failed:', error.message);
        process.exit(1);
    }
}

// Send all transactions from MongoDB to Kafka topic
async function sendTransactionsToKafka(req, res) {
    try {
        

        const transactions = await db.collection(COLLECTION_NAME).find({}).toArray();

        const messages = transactions.map(tx => ({
            key: tx._id.toString(),
            value: JSON.stringify(tx)
        }));

        const result = await producer.send({
            topic: 'Transaction-Topic',
            messages: messages
        });

        console.log(` Sent ${messages.length} transactions to Kafka`);
        res.json({ status: "Transactions sent to Kafka", result });
    } catch (error) {
        console.error(' Failed to send transactions to Kafka:', error.message);
        res.status(500).json({ error: "Kafka send failed" });
    }
}


// GET /transactions → fetch all transactions from MongoDB
app.get('/transactions', async (req, res) => {
    try {
        const transactions = await db.collection(COLLECTION_NAME).find({}).toArray();
        res.json(transactions);
    } catch (error) {
        console.error(" Error fetching transactions:", error.message);
        res.status(500).json({ error: "Failed to fetch transactions" });
    }
});

//  send all transactions to Kafka
app.post('/send-to-kafka', sendTransactionsToKafka);




async function startServer() {
    await connectToMongoDB(); // Connect to MongoDB first
    await connectKafkaProducer(); // Connect Kafka producer next
    app.listen(PORT, () => {
        console.log(` Transaction Generator API listening on port ${PORT}`);
    });
}



startServer(); 
