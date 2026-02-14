const express = require("express");
const router = express.Router();

const {
  getContent,
  previewFile,
  downloadFile,
} = require("../controllers/contentController");

router.get("/:linkId", getContent);
router.get("/:linkId/preview", previewFile);
router.get("/:linkId/download", downloadFile);

module.exports = router;
