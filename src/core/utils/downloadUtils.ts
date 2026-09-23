/**
 * Utility for triggering browser file downloads via temporary anchor element.
 */

/**
 * Triggers a file download in the browser.
 * Supports passing either a Blob (auto-creates and revokes ObjectURL) or a URL string.
 *
 * @param source Blob or URL string to download
 * @param fileName Target filename for the downloaded file
 */
export function triggerFileDownload(
  source: Blob | string,
  fileName: string,
): void {
  const isBlob = typeof Blob !== "undefined" && source instanceof Blob;
  const url = isBlob ? URL.createObjectURL(source) : (source as string);

  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  anchor.style.display = "none";
  document.body.appendChild(anchor);
  anchor.click();
  document.body.removeChild(anchor);

  if (isBlob) {
    URL.revokeObjectURL(url);
  }
}
