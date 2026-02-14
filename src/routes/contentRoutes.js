const express = require("express");
const router = express.Router();

const contentController = require("../controllers/contentController");

router.get("/:linkId", contentController.getContent);
router.get("/:linkId/preview", contentController.previewFile);
router.get("/:linkId/download", contentController.downloadFile);

module.exports = router;
