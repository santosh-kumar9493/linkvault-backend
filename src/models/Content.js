const mongoose = require("mongoose");

const ContentSchema = new mongoose.Schema(
  {
    linkId: { type: String, required: true, unique: true },

    type: { type: String, enum: ["text", "file"], required: true },

    text: { type: String, default: null },

    filePath: { type: mongoose.Schema.Types.ObjectId, default: null },
    originalName: { type: String, default: null },

    expiresAt: { type: Date, required: true },

    passwordHash: { type: String, default: null },

    // View once feature
    oneTimeView: { type: Boolean, default: false },
    viewCount: { type: Number, default: 0 },
  },
  { timestamps: true }
);

module.exports = mongoose.model("Content", ContentSchema);