export function downloadFile(json: any, filenameOverride?: string) {
    const data = JSON.stringify(json);

    const blob = new Blob([data], { type: "application/json" });
    const jsonObjectUrl = URL.createObjectURL(blob);

    const filename = "example.json";
    const anchorEl = document.createElement("a");
    anchorEl.href = jsonObjectUrl;
    anchorEl.download = filenameOverride ? filenameOverride : filename;
    anchorEl.click();
    URL.revokeObjectURL(jsonObjectUrl);
}