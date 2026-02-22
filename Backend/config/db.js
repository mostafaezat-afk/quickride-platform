const mongoose = require("mongoose");
const { MongoMemoryServer } = require("mongodb-memory-server");

let MONGO_DB = {
  production: { url: process.env.MONGODB_PROD_URL, type: "Atlas" },
  development: { url: process.env.MONGODB_DEV_URL, type: "Compass" },
};

let environment = process.env.ENVIRONMENT;

const connectDB = async () => {
  try {
    if (environment === "development") {
      console.log("Starting In-Memory MongoDB... (first run may take a minute to download binary)");
      const mongoServer = await MongoMemoryServer.create({
        instance: {
          launchTimeout: 60000,
        },
      });
      const mongoUri = mongoServer.getUri();
      await mongoose.connect(mongoUri, { serverSelectionTimeoutMS: 10000 });
      console.log("Connected to In-Memory MongoDB Simulator");
    } else {
      await mongoose.connect(MONGO_DB[environment].url, { serverSelectionTimeoutMS: 5000 });
      console.log("Connected to Mongo DB", MONGO_DB[environment].type);
    }
  } catch (err) {
    console.log("Failed to connect to MongoDB:", err.message);
  }
};

connectDB();

module.exports = mongoose.connection;
