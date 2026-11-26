export interface ExportOptions {
  showDentitionTitles: boolean;
  showSideLabels: boolean;
  backgroundColor: 'transparent' | string;
  hasBorder: boolean;
  borderColor: string;
  borderRadius: number;
  scale: number;
}

export const DEFAULT_EXPORT_OPTIONS: ExportOptions = {
  showDentitionTitles: true,
  showSideLabels: true,
  backgroundColor: '#FFFFFF',
  hasBorder: true,
  borderColor: '#CBD5E1',
  borderRadius: 16,
  scale: 3,
};

export async function renderSvgToPngBlob(
  svgElement: SVGSVGElement,
  options: ExportOptions = DEFAULT_EXPORT_OPTIONS
): Promise<Blob> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Remove interactive hit targets & selection highlights
  clone
    .querySelectorAll('[data-export-exclude="true"]')
    .forEach((el) => el.remove());

  if (!options.showDentitionTitles) {
    clone
      .querySelectorAll('[data-dentition-title="true"]')
      .forEach((el) => el.remove());
  }

  if (!options.showSideLabels) {
    clone
      .querySelectorAll('[data-side-label="true"]')
      .forEach((el) => el.remove());
  }

  const viewBox = clone.getAttribute('viewBox');
  let width = 900;
  let height = 400;
  if (viewBox) {
    const parts = viewBox.trim().split(/\s+/).map(Number);
    if (parts.length === 4 && !parts.some(Number.isNaN)) {
      width = parts[2];
      height = parts[3];
    }
  }

  const { scale, backgroundColor, hasBorder, borderColor, borderRadius } =
    options;
  const outWidth = Math.round(width * scale);
  const outHeight = Math.round(height * scale);

  clone.setAttribute('width', String(outWidth));
  clone.setAttribute('height', String(outHeight));
  clone.removeAttribute('class');

  const serializer = new XMLSerializer();
  let svgString = serializer.serializeToString(clone);
  if (!svgString.includes('xmlns="http://www.w3.org/2000/svg"')) {
    svgString = svgString.replace(
      '<svg',
      '<svg xmlns="http://www.w3.org/2000/svg"'
    );
  }

  const svgBlob = new Blob([svgString], {
    type: 'image/svg+xml;charset=utf-8',
  });
  const url = URL.createObjectURL(svgBlob);

  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = (err) => reject(err);
      image.src = url;
    });

    const pad = backgroundColor !== 'transparent' ? Math.round(16 * scale) : 0;
    const canvasWidth = outWidth + pad * 2;
    const canvasHeight = outHeight + pad * 2;

    const canvas = document.createElement('canvas');
    canvas.width = canvasWidth;
    canvas.height = canvasHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Không thể khởi tạo Canvas 2D context.');
    }

    ctx.clearRect(0, 0, canvasWidth, canvasHeight);

    if (backgroundColor !== 'transparent') {
      const borderWidth = hasBorder ? 2 * scale : 0;
      const inset = borderWidth / 2;
      const radiusPx = borderRadius * scale;

      ctx.save();
      ctx.beginPath();
      ctx.roundRect(
        inset,
        inset,
        canvasWidth - inset * 2,
        canvasHeight - inset * 2,
        radiusPx
      );
      ctx.fillStyle = backgroundColor;
      ctx.fill();

      if (hasBorder) {
        ctx.lineWidth = borderWidth;
        ctx.strokeStyle = borderColor;
        ctx.stroke();
      }
      ctx.restore();
    }

    ctx.drawImage(img, pad, pad, outWidth, outHeight);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    );
    if (!pngBlob) {
      throw new Error('Không thể tạo file PNG.');
    }

    return pngBlob;
  } finally {
    URL.revokeObjectURL(url);
  }
}

export function downloadPngBlob(blob: Blob, filename = 'so-do-rang.png'): void {
  const downloadUrl = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = downloadUrl;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(downloadUrl);
}

export async function copyPngBlobToClipboard(blob: Blob): Promise<void> {
  if (!navigator.clipboard || typeof ClipboardItem === 'undefined') {
    throw new Error('Trình duyệt không hỗ trợ copy ảnh vào clipboard.');
  }
  await navigator.clipboard.write([new ClipboardItem({ 'image/png': blob })]);
}
