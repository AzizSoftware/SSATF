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


if (!MONGO_URI) {
    console.error(" MongoDB URI is not configured correctly in the .env file");
    process.exit(1);
}

let mongoClient;
let db; 


async function connectToMongoDB() {
    try {
        mongoClient = new MongoClient(MONGO_URI, {});
        await mongoClient.connect();
        db = mongoClient.db(DATABASE_NAME);
        console.log("Connected successfully to MongoDB");
        console.log(` Using database: ${db.databaseName}`);
    } catch (error) {
        console.error(" MongoDB connection failed:", error.message);
        process.exit(1);
    }
}




async function startServer() {
    await connectToMongoDB();
    app.listen(PORT, () => {
        console.log(` Transaction Generator API listening on port ${PORT}`);
    });
}


startServer();
