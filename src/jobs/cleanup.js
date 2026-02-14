const cron = require("node-cron");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");
const Content = require("../models/Content");

const runCleanup = () => {
  // Runs every 1 minute
  cron.schedule("* * * * *", async () => {
    try {
      const now = new Date();

      const expired = await Content.find({ expiresAt: { $lt: now } });

      if (!expired.length) return;

      const bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: "uploads",
      });

      for (const item of expired) {
        if (item.type === "file" && item.filePath) {
          try {
            await bucket.delete(new ObjectId(item.filePath));
          } catch (err) {
            console.log("GridFS delete skipped:", item.filePath);
          }
        }
      }

      await Content.deleteMany({ expiresAt: { $lt: now } });

      console.log(`Cleanup removed ${expired.length} expired items`);
    } catch (err) {
      console.error("Cleanup job failed:", err);
    }
  });
};

module.exports = runCleanup;
