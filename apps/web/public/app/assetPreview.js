function formatBytes(bytes) {
  if (!Number.isFinite(bytes) || bytes <= 0) {
    return "0 B";
  }

  const units = ["B", "KB", "MB", "GB"];
  const unitIndex = Math.min(Math.floor(Math.log(bytes) / Math.log(1024)), units.length - 1);
  const value = bytes / 1024 ** unitIndex;

  return `${value >= 10 || unitIndex === 0 ? value.toFixed(0) : value.toFixed(1)} ${units[unitIndex]}`;
}

function loadImageDimensions(objectUrl) {
  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      resolve({
        width: image.naturalWidth,
        height: image.naturalHeight,
      });
    };
    image.onerror = () => reject(new Error("无法读取图片尺寸。"));
    image.src = objectUrl;
  });
}

export async function buildAssetPreview(file) {
  if (!(file instanceof File)) {
    throw new Error("未读取到有效文件。");
  }

  if (!file.type.startsWith("image/")) {
    throw new Error("仅支持图片文件");
  }

  const objectUrl = URL.createObjectURL(file);

  try {
    const dimensions = await loadImageDimensions(objectUrl);

    return {
      objectUrl,
      fileName: file.name,
      mimeType: file.type,
      sizeLabel: formatBytes(file.size),
      dimensionsLabel: `${dimensions.width} × ${dimensions.height}`,
    };
  } catch (error) {
    URL.revokeObjectURL(objectUrl);
    throw error;
  }
}

export async function buildAssetPreviews(files) {
  const fileList = Array.from(files || []);
  if (fileList.length === 0) {
    return [];
  }

  return Promise.all(fileList.map((file) => buildAssetPreview(file)));
}

export function revokeAssetPreview(preview) {
  if (preview?.objectUrl) {
    URL.revokeObjectURL(preview.objectUrl);
  }
}

export function revokeAssetPreviews(previews) {
  for (const preview of previews || []) {
    revokeAssetPreview(preview);
  }
}
