const Content = require("../models/Content");
const mongoose = require("mongoose");
const { GridFSBucket, ObjectId } = require("mongodb");
const bcrypt = require("bcryptjs");

function base(req) {
  return `https://${req.headers.host}`;
}

exports.getContent = async (req, res) => {
  try {
    const content = await Content.findOne({ linkId: req.params.linkId });

    if (!content) return res.status(403).json({ error: "Invalid link" });
    if (new Date() > content.expiresAt)
      return res.status(410).json({ error: "Link expired" });

    // password
    if (content.passwordHash) {
      const p = req.headers["x-link-password"];
      if (!p) return res.status(401).json({ passwordRequired: true });
      const ok = await bcrypt.compare(p, content.passwordHash);
      if (!ok) return res.status(403).json({ error: "Wrong password" });
    }

    // increase view count
    content.viewCount += 1;
    await content.save();

    // one-time view
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
  } catch (e) {
    res.status(500).json({ error: "Failed" });
  }
};
