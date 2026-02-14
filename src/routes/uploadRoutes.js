const express = require("express");
const router = express.Router();
const upload = require("../utils/multer");
const { upload: uploadHandler } = require("../controllers/uploadController");

router.post("/", (req, res, next) => {
  upload.single("file")(req, res, function (err) {
    if (err) {
      return res.status(400).json({ error: "File too large (max 10MB)" });
    }
    next();
  });
}, uploadHandler);


module.exports = router;
