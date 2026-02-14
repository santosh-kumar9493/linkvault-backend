const Content = require("../models/Content");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

function base(req) {
  return `https://${req.headers.host}`;
}

// ================= GET CONTENT =================
exports.getContent = async (req, res) => {
  try {
    const content = await Content.findOne({ linkId: req.params.linkId });

    if (!content) return res.status(403).json({ error: "Invalid link" });
    if (new Date() > content.expiresAt)
      return res.status(410).json({ error: "Link expired" });

    // Password check
    if (content.passwordHash) {
      const provided = req.headers["x-link-password"];
      if (!provided) return res.status(401).json({ passwordRequired: true });

      const ok = await bcrypt.compare(provided, content.passwordHash);
      if (!ok) return res.status(403).json({ error: "Wrong password" });
    }

    content.viewCount += 1;
    await content.save();

    if (content.oneTimeView && content.viewCount > 1) {
      await Content.deleteOne({ _id: content._id });
      return res.status(410).json({ error: "Link expired" });
    }

    if (content.type === "text") {
      return res.json({
        type: "text",
        text: content.text,
        expiresAt: content.expiresAt,
        views: content.viewCount,
      });
    }

    const b = base(req);

    return res.json({
      type: "file",
      fileName: content.originalName,
      previewUrl: `${b}/content/${content.linkId}/preview`,
      downloadUrl: `${b}/content/${content.linkId}/download`,
      expiresAt: content.expiresAt,
      views: content.viewCount,
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Failed" });
  }
};

// ================= PREVIEW FILE =================
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

    const mime = fileDoc?.contentType || "application/pdf";

    res.setHeader("Content-Type", mime);
    res.setHeader("Content-Disposition", "inline");

    bucket
      .openDownloadStream(new ObjectId(content.filePath))
      .on("error", () => res.status(404).send("File not found"))
      .pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Preview failed");
  }
};

// ================= DOWNLOAD FILE =================
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

    bucket
      .openDownloadStream(new ObjectId(content.filePath))
      .on("error", () => res.status(404).send("File not found"))
      .pipe(res);
  } catch (err) {
    console.error(err);
    res.status(500).send("Download failed");
  }
};