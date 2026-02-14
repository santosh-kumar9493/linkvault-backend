const Content = require("../models/Content");
const generateId = require("../utils/generateId");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

const DEV_MODE = process.env.DEV_MODE === "true";

exports.upload = async (req, res) => {
  try {
    const { text, expiryOption, customExpiry } = req.body;

    if (!text && !req.file) {
      return res.status(400).json({ error: "Text or file required" });
    }

    const linkId = generateId();

    let expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    if (DEV_MODE && expiryOption === "10s") {
      expiresAt = new Date(Date.now() + 10 * 1000);
    } else if (expiryOption === "1h") {
      expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    } else if (expiryOption === "24h") {
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);
    } else if (expiryOption === "custom" && customExpiry) {
      const d = new Date(customExpiry);
      if (!isNaN(d.getTime()) && d > new Date()) {
        expiresAt = d;
      }
    }

    let fileId = null;

    if (req.file) {
      const bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: "uploads",
      });

      fileId = await new Promise((resolve, reject) => {
        const uploadStream = bucket.openUploadStream(req.file.originalname);
        uploadStream.on("finish", () => resolve(uploadStream.id));
        uploadStream.on("error", reject);
        uploadStream.end(req.file.buffer);
      });
    }

    const content = await Content.create({
      linkId,
      type: req.file ? "file" : "text",
      text: text || null,
      filePath: fileId,
      originalName: req.file ? req.file.originalname : null,
      expiresAt,
    });

    // IMPORTANT: return only linkId
    res.json({
      linkId: content.linkId,
      expiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};
