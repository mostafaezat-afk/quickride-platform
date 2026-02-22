// Script to fix MongoDB indexes after removing email field
require("dotenv").config();
const mongoose = require("mongoose");

const MONGO_URL = process.env.MONGODB_PROD_URL || process.env.MONGODB_DEV_URL;

async function fixIndexes() {
    try {
        console.log("Connecting to MongoDB...");
        await mongoose.connect(MONGO_URL);
        console.log("Connected successfully!\n");

        const db = mongoose.connection.db;

        // Fix Users collection
        console.log("=== Fixing Users Collection ===");
        const usersCollection = db.collection("users");

        // List current indexes
        const userIndexes = await usersCollection.indexes();
        console.log("Current user indexes:", JSON.stringify(userIndexes, null, 2));

        // Drop email index if it exists
        for (const idx of userIndexes) {
            if (idx.key && idx.key.email !== undefined) {
                console.log(`Dropping email index: ${idx.name}`);
                await usersCollection.dropIndex(idx.name);
                console.log("Email index dropped successfully!");
            }
        }

        // Delete old users without phone numbers
        const deletedUsers = await usersCollection.deleteMany({
            $or: [
                { phone: null },
                { phone: { $exists: false } },
                { phone: "" }
            ]
        });
        console.log(`Deleted ${deletedUsers.deletedCount} users without phone numbers`);

        // Show remaining users
        const userCount = await usersCollection.countDocuments();
        console.log(`Remaining users: ${userCount}`);
        const allUsers = await usersCollection.find({}, { projection: { fullname: 1, phone: 1 } }).toArray();
        allUsers.forEach(u => console.log(`  - ${u.fullname?.firstname} ${u.fullname?.lastname}: ${u.phone}`));

        // Fix Captains collection
        console.log("\n=== Fixing Captains Collection ===");
        const captainsCollection = db.collection("captains");

        // List current indexes
        const captainIndexes = await captainsCollection.indexes();
        console.log("Current captain indexes:", JSON.stringify(captainIndexes, null, 2));

        // Drop email index if it exists
        for (const idx of captainIndexes) {
            if (idx.key && idx.key.email !== undefined) {
                console.log(`Dropping email index: ${idx.name}`);
                await captainsCollection.dropIndex(idx.name);
                console.log("Email index dropped successfully!");
            }
        }

        // Delete old captains without phone numbers
        const deletedCaptains = await captainsCollection.deleteMany({
            $or: [
                { phone: null },
                { phone: { $exists: false } },
                { phone: "" }
            ]
        });
        console.log(`Deleted ${deletedCaptains.deletedCount} captains without phone numbers`);

        // Show remaining captains
        const captainCount = await captainsCollection.countDocuments();
        console.log(`Remaining captains: ${captainCount}`);
        const allCaptains = await captainsCollection.find({}, { projection: { fullname: 1, phone: 1 } }).toArray();
        allCaptains.forEach(c => console.log(`  - ${c.fullname?.firstname} ${c.fullname?.lastname}: ${c.phone}`));

        // Verify final indexes
        console.log("\n=== Final Indexes ===");
        const finalUserIndexes = await usersCollection.indexes();
        console.log("User indexes:", JSON.stringify(finalUserIndexes, null, 2));
        const finalCaptainIndexes = await captainsCollection.indexes();
        console.log("Captain indexes:", JSON.stringify(finalCaptainIndexes, null, 2));

        console.log("\n✅ Done! Indexes fixed successfully.");
    } catch (error) {
        console.error("Error:", error);
    } finally {
        await mongoose.disconnect();
        console.log("Disconnected from MongoDB.");
    }
}

fixIndexes();
