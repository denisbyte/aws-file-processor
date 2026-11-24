import {
    S3Client,
    PutObjectCommand,
    GetObjectCommand
} from "@aws-sdk/client-s3";

const REGION = process.env.AWS_REGION || "us-east-1";
const BUCKET_NAME = process.env.S3_BUCKET_NAME;

const s3Client = new S3Client({
    region: REGION
});

// Envoi du fichier CSV
export async function uploadCSV(fileId, fileBuffer) {
    const key = `input/${fileId}.csv`;

    await s3Client.send(
        new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: fileBuffer,
            ContentType: "text/csv"
        })
    );

    return key;
}

// Enregistrement du rapport JSON
export async function saveReport(fileId, report) {
    const key = `output/${fileId}.json`;

    await s3Client.send(
        new PutObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key,
            Body: JSON.stringify(report, null, 2),
            ContentType: "application/json"
        })
    );

    return key;
}

// Récupération du rapport JSON
export async function getReport(fileId) {
    const key = `output/${fileId}.json`;

    const response = await s3Client.send(
        new GetObjectCommand({
            Bucket: BUCKET_NAME,
            Key: key
        })
    );

    const content = await response.Body.transformToString();

    return JSON.parse(content);
}