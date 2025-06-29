const multer = require("multer");
const fs = require("fs");

// Multer setup: Store file in memory
// Custom storage to keep original filename
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/"); // ensure this folder exists
  },
  filename: function (req, file, cb) {
    cb(null, file.originalname); // this preserves the original file name
  },
});

const upload = multer({ storage });

module.exports = upload;