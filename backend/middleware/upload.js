const path = require("path");
const fs = require("fs");
const multer = require("multer");

// Local disk upload (no cloud). Produces URLs like /uploads/<filename>
const ensureDirSync = (dirPath) => {
  if (!fs.existsSync(dirPath)) {
    fs.mkdirSync(dirPath, { recursive: true });
  }
};

const UPLOAD_DIR = process.env.UPLOAD_DIR || path.join(__dirname, "../../uploads");
ensureDirSync(UPLOAD_DIR);

const ALLOWED_MIME = new Set([
  "image/jpeg",
  "image/png",
  "image/webp",
  "image/gif",
]);

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, UPLOAD_DIR);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || "");
    const base = path.basename(file.originalname || "image").replace(ext, "");
    const safeBase = base.replace(/[^a-zA-Z0-9_-]/g, "").slice(0, 40) || "image";
    const unique = Date.now() + "-" + Math.round(Math.random() * 1e9);
    cb(null, `${safeBase}-${unique}${ext}`);
  },
});

const fileFilter = (req, file, cb) => {
  if (!ALLOWED_MIME.has(file.mimetype)) {
    return cb(new Error("Only image files are allowed (jpg, png, webp, gif)"));
  }
  cb(null, true);
};

// Accept multiple files under field name 'images'
const uploadImages = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB each (adjust if needed)
    files: 10,
  },
});

module.exports = {
  UPLOAD_DIR,
  uploadImages,
};

