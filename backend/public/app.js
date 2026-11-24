const uploadForm = document.getElementById("uploadForm");
const statusForm = document.getElementById("statusForm");

const csvFile = document.getElementById("csvFile");
const fileIdInput = document.getElementById("fileId");

const uploadButton = document.getElementById("uploadButton");
const downloadButton = document.getElementById("downloadButton");

const uploadMessage = document.getElementById("uploadMessage");
const statusMessage = document.getElementById("statusMessage");

const resultsSection = document.getElementById("resultsSection");

let currentReport = null;

// Affichage des messages
function showMessage(element, message, type = "") {
    element.textContent = message;
    element.className = type;
}

// Réinitialisation des résultats
function clearResults() {
    currentReport = null;
    resultsSection.hidden = true;
}

// Affichage du rapport
function displayReport(report) {
    currentReport = report;

    resultsSection.hidden = false;

    document.getElementById("fileName").textContent =
        report.filename;

    const processingStatus =
        document.getElementById("processingStatus");

    processingStatus.textContent =
        report.status === "COMPLETED"
            ? "Terminé"
            : "Échec";

    processingStatus.className =
        report.status === "COMPLETED"
            ? "success"
            : "error";

    const stats = report.statistics || {};

    document.getElementById("totalRows").textContent =
        stats.total_rows ?? "-";

    document.getElementById("validRows").textContent =
        stats.valid_rows ?? "-";

    document.getElementById("invalidRows").textContent =
        stats.invalid_rows ?? "-";

    document.getElementById("distinctProducts").textContent =
        stats.distinct_products ?? "-";

    document.getElementById("totalRevenue").textContent =
        stats.total_revenue?.toLocaleString("fr-FR") ?? "-";

    const errorList = document.getElementById("errorList");

    errorList.replaceChildren();

    const errors = report.errors || [];

    if (report.error) {
        const item = document.createElement("li");
        item.textContent = report.error;
        errorList.appendChild(item);

    } else if (errors.length === 0) {
        const item = document.createElement("li");
        item.textContent = "Aucune ligne invalide détectée.";
        item.className = "success";
        errorList.appendChild(item);

    } else {
        errors.forEach(error => {
            const item = document.createElement("li");

            item.textContent =
                `Ligne ${error.line} : ${error.reason}`;

            errorList.appendChild(item);
        });
    }

    document.getElementById("jsonReport").textContent =
        JSON.stringify(report, null, 2);
}

// Envoi et traitement du fichier CSV
uploadForm.addEventListener("submit", async event => {
    event.preventDefault();

    clearResults();

    const file = csvFile.files[0];

    if (!file) {
        showMessage(
            uploadMessage,
            "Veuillez sélectionner un fichier CSV.",
            "error"
        );
        return;
    }

    if (!file.name.toLowerCase().endsWith(".csv")) {
        showMessage(
            uploadMessage,
            "Seuls les fichiers CSV sont acceptés.",
            "error"
        );
        return;
    }

    if (file.size > 5 * 1024 * 1024) {
        showMessage(
            uploadMessage,
            "Le fichier dépasse la limite de 5 Mo.",
            "error"
        );
        return;
    }

    const formData = new FormData();
    formData.append("file", file);

    uploadButton.disabled = true;

    showMessage(uploadMessage, "Traitement en cours...");

    try {
        const response = await fetch("/upload", {
            method: "POST",
            body: formData
        });

        const report = await response.json();

        if (!response.ok && response.status !== 422) {
            throw new Error(report.error || "Échec du traitement");
        }

        fileIdInput.value = report.file_id;

        displayReport(report);

        showMessage(
            uploadMessage,
            `Traitement ${response.ok ? "terminé" : "échoué"}.
             Identifiant : ${report.file_id}`,
            response.ok ? "success" : "error"
        );

    } catch (error) {
        showMessage(uploadMessage, error.message, "error");

    } finally {
        uploadButton.disabled = false;
    }
});

// Consultation du statut et du rapport
statusForm.addEventListener("submit", async event => {
    event.preventDefault();

    clearResults();

    const fileId = fileIdInput.value.trim();

    if (!fileId) {
        return;
    }

    showMessage(statusMessage, "Recherche en cours...");

    try {
        const statusResponse = await fetch(
            `/status/${encodeURIComponent(fileId)}`
        );

        const status = await statusResponse.json();

        if (!statusResponse.ok) {
            throw new Error(status.error);
        }

        const reportResponse = await fetch(
            `/report/${encodeURIComponent(fileId)}`
        );

        const report = await reportResponse.json();

        if (!reportResponse.ok) {
            throw new Error(report.error);
        }

        displayReport(report);

        showMessage(
            statusMessage,
            `Statut : ${status.status}`,
            status.status === "COMPLETED"
                ? "success"
                : "error"
        );

    } catch (error) {
        showMessage(statusMessage, error.message, "error");
    }
});

// Téléchargement du rapport JSON
downloadButton.addEventListener("click", () => {
    if (!currentReport) {
        return;
    }

    const blob = new Blob(
        [JSON.stringify(currentReport, null, 2)],
        { type: "application/json" }
    );

    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = `${currentReport.file_id}.json`;

    document.body.appendChild(link);
    link.click();
    link.remove();

    URL.revokeObjectURL(url);
});