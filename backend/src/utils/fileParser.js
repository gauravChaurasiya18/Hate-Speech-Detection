const { parse } = require("csv-parse/sync");

const MAX_BULK_ROWS = 200;

const parseUploadedFile = (file) => {
  const content = file.buffer.toString("utf8");
  if (/\.csv$/i.test(file.originalname) || file.mimetype.includes("csv")) {
    const rows = parse(content, {
      columns: true,
      skip_empty_lines: true,
      trim: true
    });

    return rows
      .map((row) => row.text || row.comment || row.content || row.message || Object.values(row)[0])
      .filter(Boolean)
      .map(String)
      .slice(0, MAX_BULK_ROWS);
  }

  return content
    .split(/\r?\n/)
    .map((line) => line.trim())
    .filter(Boolean)
    .slice(0, MAX_BULK_ROWS);
};

module.exports = parseUploadedFile;

