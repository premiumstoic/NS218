export interface ImageCompressionOptions {
  maxBytes: number;
  maxWidth: number;
  maxHeight: number;
  outputType?: "image/webp" | "image/jpeg";
  initialQuality?: number;
  minQuality?: number;
  forceTransform?: boolean;
}

const QUALITY_STEP = 0.1;
const SCALE_STEP = 0.85;
const MIN_SCALE = 0.4;

async function loadImageElement(file: File): Promise<HTMLImageElement> {
  const imageUrl = URL.createObjectURL(file);

  return new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => {
      URL.revokeObjectURL(imageUrl);
      resolve(image);
    };
    image.onerror = () => {
      URL.revokeObjectURL(imageUrl);
      reject(new Error("Could not decode image in browser"));
    };
    image.src = imageUrl;
  });
}

function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Failed to create compressed image blob"));
          return;
        }
        resolve(blob);
      },
      type,
      quality
    );
  });
}

function withExtension(name: string, extension: string): string {
  const clean = name.replace(/[^a-zA-Z0-9_.-]/g, "_");
  const dotIndex = clean.lastIndexOf(".");
  const base = dotIndex > 0 ? clean.slice(0, dotIndex) : clean;
  return `${base}${extension}`;
}

export async function compressImageForUpload(file: File, options: ImageCompressionOptions): Promise<File> {
  if (!file.type.startsWith("image/")) {
    return file;
  }

  if (typeof window === "undefined") {
    return file;
  }

  const {
    maxBytes,
    maxWidth,
    maxHeight,
    outputType = "image/webp",
    initialQuality = 0.9,
    minQuality = 0.45,
    forceTransform = false
  } = options;

  const image = await loadImageElement(file);

  const initialScale = Math.min(1, maxWidth / Math.max(image.naturalWidth, 1), maxHeight / Math.max(image.naturalHeight, 1));
  const fitsBounds = initialScale >= 1;
  const fitsSize = file.size <= maxBytes;

  if (!forceTransform && fitsBounds && fitsSize) {
    return file;
  }

  const canvas = document.createElement("canvas");
  const context = canvas.getContext("2d");

  if (!context) {
    throw new Error("Canvas is not available for image compression");
  }

  let scale = initialScale;
  let quality = initialQuality;
  let bestBlob: Blob | null = null;

  while (scale >= MIN_SCALE) {
    const targetWidth = Math.max(1, Math.round(image.naturalWidth * scale));
    const targetHeight = Math.max(1, Math.round(image.naturalHeight * scale));

    canvas.width = targetWidth;
    canvas.height = targetHeight;
    context.clearRect(0, 0, targetWidth, targetHeight);
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    quality = initialQuality;
    while (quality >= minQuality) {
      const blob = await canvasToBlob(canvas, outputType, quality);

      if (!bestBlob || blob.size < bestBlob.size) {
        bestBlob = blob;
      }

      if (blob.size <= maxBytes) {
        const extension = outputType === "image/jpeg" ? ".jpg" : ".webp";
        const fileName = withExtension(file.name, extension);
        return new File([blob], fileName, {
          type: outputType,
          lastModified: Date.now()
        });
      }

      quality = Number((quality - QUALITY_STEP).toFixed(2));
    }

    scale = Number((scale * SCALE_STEP).toFixed(3));
  }

  if (bestBlob) {
    const extension = outputType === "image/jpeg" ? ".jpg" : ".webp";
    const fileName = withExtension(file.name, extension);
    return new File([bestBlob], fileName, {
      type: outputType,
      lastModified: Date.now()
    });
  }

  throw new Error("Unable to compress image");
}
