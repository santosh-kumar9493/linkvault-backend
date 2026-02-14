const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema({
  linkId: {
    type: String,
    required: true,
    unique: true,
    index: true,
  },
  type: {
    type: String,
    enum: ["text", "file"],
    required: true,
  },
  text: String,
  filePath: String,
  originalName: String,
  expiresAt: {
    type: Date,
    required: true,
    index: true,
  },
}, { timestamps: true });

module.exports = mongoose.model("Content", ContentSchema);
