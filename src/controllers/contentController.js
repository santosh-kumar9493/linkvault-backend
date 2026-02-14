const Content = require("../models/Content");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");

function getBaseUrl(req) {
  return `https://${req.headers.host}`;
}

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

    const base = getBaseUrl(req);

    return res.json({
      type: "file",
      fileName: content.originalName,
      previewUrl: `${base}/content/${content.linkId}/preview`,
      downloadUrl: `${base}/content/${content.linkId}/download`,
      expiresAt: content.expiresAt,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed to fetch content" });
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

    const fileDoc = await mongoose.connection.db
      .collection("uploads.files")
      .findOne({ _id: new ObjectId(content.filePath) });

    const mimeType =
      fileDoc?.contentType ||
      (content.originalName.endsWith(".pdf")
        ? "application/pdf"
        : content.originalName.match(/\.(png|jpg|jpeg|gif)$/i)
        ? "image/jpeg"
        : "text/plain");

    res.setHeader("Content-Type", mimeType);
    res.setHeader("Content-Disposition", "inline");

    const stream = bucket.openDownloadStream(new ObjectId(content.filePath));

    stream.on("error", () => res.status(404).send("File not found"));
    stream.pipe(res);
  } catch (err) {
    console.error(err);
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
  } catch (err) {
    console.error(err);
    res.status(500).send("Download failed");
  }
};
