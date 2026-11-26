export async function exportSvgToTransparentPng(
  svgElement: SVGSVGElement,
  filename = 'so-do-rang.png',
  scale = 3
): Promise<void> {
  const clone = svgElement.cloneNode(true) as SVGSVGElement;

  // Remove interactive hit targets & selection highlights
  const excluded = clone.querySelectorAll('[data-export-exclude="true"]');
  excluded.forEach((el) => el.remove());

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

    const canvas = document.createElement('canvas');
    canvas.width = outWidth;
    canvas.height = outHeight;

    const ctx = canvas.getContext('2d');
    if (!ctx) {
      throw new Error('Không thể khởi tạo Canvas 2D context.');
    }

    // Explicitly keep transparent background (no fillRect)
    ctx.clearRect(0, 0, outWidth, outHeight);
    ctx.drawImage(img, 0, 0, outWidth, outHeight);

    const pngBlob = await new Promise<Blob | null>((resolve) =>
      canvas.toBlob((blob) => resolve(blob), 'image/png')
    );
    if (!pngBlob) {
      throw new Error('Không thể tạo file PNG.');
    }

    const downloadUrl = URL.createObjectURL(pngBlob);
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(downloadUrl);
  } finally {
    URL.revokeObjectURL(url);
  }
}
