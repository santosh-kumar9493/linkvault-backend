const Content = require("../models/Content");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");

exports.getContent = async (req, res) => {
  try {
    const content = await Content.findOne({ linkId: req.params.linkId });

    if (!content) return res.status(403).json({ error: "Invalid link" });
    if (new Date() > content.expiresAt)
      return res.status(410).json({ error: "Link expired" });

    if (content.type === "text") {
      return res.json({
        type: "text",
        text: content.text,
        expiresAt: content.expiresAt,
      });
    }

    return res.json({
      type: "file",
      fileName: content.originalName,
      previewUrl: `${process.env.BASE_URL}/content/${content.linkId}/preview`,
      downloadUrl: `${process.env.BASE_URL}/content/${content.linkId}/download`,
      expiresAt: content.expiresAt,
    });
  } catch {
    res.status(500).json({ error: "Fetch failed" });
  }
};

exports.previewFile = async (req, res) => {
  try {
    const content = await Content.findOne({ linkId: req.params.linkId });
    if (!content || new Date() > content.expiresAt)
      return res.status(410).send("Link expired");

    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });

    const stream = bucket.openDownloadStream(new ObjectId(content.filePath));

    stream.on("error", () => res.status(404).send("File not found"));
    stream.pipe(res);
  } catch {
    res.status(500).send("Preview failed");
  }
};

exports.downloadFile = async (req, res) => {
  try {
    const content = await Content.findOne({ linkId: req.params.linkId });
    if (!content || new Date() > content.expiresAt)
      return res.status(410).send("Link expired");

    res.setHeader(
      "Content-Disposition",
      `attachment; filename="${content.originalName}"`
    );

    const bucket = new GridFSBucket(mongoose.connection.db, {
      bucketName: "uploads",
    });

    const stream = bucket.openDownloadStream(new ObjectId(content.filePath));

    stream.on("error", () => res.status(404).send("File not found"));
    stream.pipe(res);
  } catch {
    res.status(500).send("Download failed");
  }
};
