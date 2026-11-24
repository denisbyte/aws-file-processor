import express from "express";
import multer from "multer";
import { randomUUID } from "node:crypto";

import { processCSV } from "./services/csvProcessor.mjs";

import {
  uploadCSV,
  saveReport,
  getReport
} from "./services/s3Service.mjs";

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

app.post("/upload", upload.single("file"), async (req, res) => {
  if (!req.file) {
    return res.status(400).json({
      error: "CSV file is required"
    });
  }

  const fileId = randomUUID();

  try {
    // Stockage du fichier CSV dans S3
    await uploadCSV(fileId, req.file.buffer);

    let result;

    try {
      // Traitement du contenu CSV
      const csvContent = req.file.buffer.toString("utf-8");
      result = processCSV(csvContent);
    } catch (error) {
      result = {
        status: "FAILED",
        error: error.message
      };
    }

    // Construction du rapport
    const report = {
      file_id: fileId,
      filename: req.file.originalname,
      processed_at: new Date().toISOString(),
      ...result
    };

    // Enregistrement du rapport dans S3
    await saveReport(fileId, report);

    console.log(`File ${fileId}: ${report.status}`);

    return res.status(
      report.status === "FAILED" ? 422 : 200
    ).json(report);

  } catch (error) {
    console.error("Processing error:", error);

    return res.status(500).json({
      file_id: fileId,
      status: "FAILED",
      error: "File processing failed"
    });
  }
});

app.get("/status/:fileId", async (req, res) => {
  const { fileId } = req.params;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(fileId)) {
    return res.status(400).json({
      error: "Invalid file ID"
    });
  }

  try {
    const report = await getReport(fileId);

    return res.status(200).json({
      file_id: report.file_id,
      filename: report.filename,
      status: report.status,
      processed_at: report.processed_at
    });

  } catch (error) {
    if (error.name === "NoSuchKey") {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    console.error("Status retrieval error:", error);

    return res.status(500).json({
      error: "Unable to retrieve processing status"
    });
  }
});
app.get("/report/:fileId", async (req, res) => {
  const { fileId } = req.params;

  const uuidPattern =
    /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

  if (!uuidPattern.test(fileId)) {
    return res.status(400).json({
      error: "Invalid file ID"
    });
  }

  try {
    const report = await getReport(fileId);

    return res.status(200).json(report);

  } catch (error) {
    if (error.name === "NoSuchKey") {
      return res.status(404).json({
        error: "Report not found"
      });
    }

    console.error("Report retrieval error:", error);

    return res.status(500).json({
      error: "Unable to retrieve report"
    });
  }
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