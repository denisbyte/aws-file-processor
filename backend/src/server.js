const express = require("express");
const multer = require("multer");

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!file.originalname.toLowerCase().endsWith(".csv")) {
      return callback(new Error("Only CSV files are allowed"));
    }

    callback(null, true);
  },
});

app.get("/health", (req, res) => {
  res.status(200).json({
    status: "ok",
    service: "aws-file-processor",
  });
});

app.post("/upload", upload.single("file"), (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "CSV file is required",
    });
  }

  return res.status(200).json({
    message: "CSV file received successfully",
    filename: req.file.originalname,
    size: req.file.size,
  });
});

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    return res.status(400).json({
      error: err.message,
    });
  }

  return res.status(400).json({
    error: err.message,
  });
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});