const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Configure storage
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    const uploadDir = path.join(__dirname, '../uploads');
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir);
    }
    cb(null, uploadDir);
  },
  filename: function (req, file, cb) {
    // Unique filename: timestamp-originalName
    cb(null, Date.now() + '-' + file.originalname.replace(/\s+/g, '-'));
  }
});

const upload = multer({
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 }, // 10MB limit
});

// Upload endpoint
router.post('/', upload.single('file'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ message: 'No file uploaded' });
  }

  // Return the file URL
  // Assuming server is running on localhost/domain
  // We return a relative path or full URL if we knew the host.
  // Frontend can prepend API URL.
  const fileUrl = `/uploads/${req.file.filename}`;

  res.json({
    message: 'File uploaded successfully',
    fileUrl: fileUrl,
    filename: req.file.originalname,
    storedName: req.file.filename,
    type: req.file.mimetype
  });
});

module.exports = router;
