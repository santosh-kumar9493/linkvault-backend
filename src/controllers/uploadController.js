const Content = require("../models/Content");
const generateId = require("../utils/generateId");
const mongoose = require("mongoose");
const { GridFSBucket } = require("mongodb");
const bcrypt = require("bcryptjs");

exports.upload = async (req, res) => {
  try {
    const { text, expiryOption, oneTimeView, password } = req.body;

    if (!text && !req.file)
      return res.status(400).json({ error: "Text or file required" });

    const linkId = generateId();

    let expiresAt = new Date(Date.now() + 10 * 60 * 1000);
    if (expiryOption === "1h")
      expiresAt = new Date(Date.now() + 60 * 60 * 1000);
    if (expiryOption === "24h")
      expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    let fileId = null;

    if (req.file) {
      const bucket = new GridFSBucket(mongoose.connection.db, {
        bucketName: "uploads",
      });

      fileId = await new Promise((resolve, reject) => {
        const stream = bucket.openUploadStream(req.file.originalname, {
          contentType: req.file.mimetype,
        });
        stream.on("finish", () => resolve(stream.id));
        stream.on("error", reject);
        stream.end(req.file.buffer);
      });
    }

    let passwordHash = null;
    if (password && password.trim())
      passwordHash = await bcrypt.hash(password, 10);

    const content = await Content.create({
      linkId,
      type: req.file ? "file" : "text",
      text: text || null,
      filePath: fileId,
      originalName: req.file ? req.file.originalname : null,
      expiresAt,
      passwordHash,
      oneTimeView: oneTimeView === "true",
      viewCount: 0,
    });

    res.json({ linkId, expiresAt });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Upload failed" });
  }
};