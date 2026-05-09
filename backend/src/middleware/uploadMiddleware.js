const multer = require("multer");
const ApiError = require("../utils/ApiError");

const storage = multer.memoryStorage();

const upload = multer({
  storage,
  limits: { fileSize: 2 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    const allowed = ["text/plain", "text/csv", "application/vnd.ms-excel", "application/csv"];
    const byName = /\.(txt|csv)$/i.test(file.originalname);
    if (allowed.includes(file.mimetype) || byName) return cb(null, true);
    cb(new ApiError(400, "Only CSV and TXT files are supported"));
  }
});

module.exports = upload;

