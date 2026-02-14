const Content = require("../models/Content");
const generateId = require("../utils/generateId");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");

const DEV_MODE = true; // set false before submission

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
    }

    let fileId = null;

    if (req.file) {
      const bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: "uploads",
      });

      const uploadStream = bucket.openUploadStream(req.file.originalname);

      uploadStream.end(req.file.buffer);

      await new Promise((resolve, reject) => {
        uploadStream.on("finish", resolve);
        uploadStream.on("error", reject);
      });

      fileId = uploadStream.id;
    }

    const content = await Content.create({
      linkId,
      type: req.file ? "file" : "text",
      text: text || null,
      filePath: fileId,
      originalName: req.file ? req.file.originalname : null,
      expiresAt,
    });

    res.json({
      link: `${process.env.BASE_URL}/content/${content.linkId}`,
      expiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};
