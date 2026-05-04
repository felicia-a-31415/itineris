const MAX_OPENAI_IMAGE_BYTES = 5 * 1024 * 1024;
const TARGET_OPENAI_IMAGE_BYTES = 4.5 * 1024 * 1024;
const MAX_DOCUMENT_BYTES = 4.5 * 1024 * 1024;
const MAX_TEXT_CHARS = 120_000;

export type ChatAttachment = {
  id: string;
  name: string;
  mediaType: string;
  kind: 'image' | 'pdf' | 'text';
  data?: string;
  text?: string;
  size: number;
};

async function readFileAsDataUrl(file: Blob): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Impossible de lire le fichier.'));
        return;
      }
      resolve(reader.result);
    };

    reader.onerror = () => reject(new Error('Impossible de lire le fichier.'));
    reader.readAsDataURL(file);
  });
}

async function readFileAsText(file: File): Promise<string> {
  return await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();

    reader.onload = () => {
      if (typeof reader.result !== 'string') {
        reject(new Error('Impossible de lire le fichier texte.'));
        return;
      }
      resolve(reader.result);
    };

    reader.onerror = () => reject(new Error('Impossible de lire le fichier texte.'));
    reader.readAsText(file);
  });
}

async function loadImageFromFile(file: File): Promise<HTMLImageElement> {
  const dataUrl = await readFileAsDataUrl(file);

  return await new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("Impossible de charger l'image."));
    image.src = dataUrl;
  });
}

async function canvasToBlob(canvas: HTMLCanvasElement, quality: number): Promise<Blob> {
  return await new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error("Impossible de compresser l'image."));
          return;
        }
        resolve(blob);
      },
      'image/jpeg',
      quality
    );
  });
}

function getDecodedByteLengthFromBase64(base64: string) {
  const padding = base64.endsWith('==') ? 2 : base64.endsWith('=') ? 1 : 0;
  return Math.floor((base64.length * 3) / 4) - padding;
}

export async function prepareImageForOpenAi(file: File): Promise<{ mediaType: string; data: string }> {
  const image = await loadImageFromFile(file);
  const canvas = document.createElement('canvas');
  const context = canvas.getContext('2d');

  if (!context) {
    throw new Error("Impossible de préparer l'image.");
  }

  let width = image.naturalWidth;
  let height = image.naturalHeight;
  const maxDimension = 1800;

  if (Math.max(width, height) > maxDimension) {
    const scale = maxDimension / Math.max(width, height);
    width = Math.max(1, Math.round(width * scale));
    height = Math.max(1, Math.round(height * scale));
  }

  const attempts = [
    { scale: 1, quality: 0.8 },
    { scale: 0.9, quality: 0.72 },
    { scale: 0.8, quality: 0.64 },
    { scale: 0.7, quality: 0.56 },
    { scale: 0.6, quality: 0.5 },
  ];

  for (const attempt of attempts) {
    const attemptWidth = Math.max(1, Math.round(width * attempt.scale));
    const attemptHeight = Math.max(1, Math.round(height * attempt.scale));
    canvas.width = attemptWidth;
    canvas.height = attemptHeight;
    context.clearRect(0, 0, attemptWidth, attemptHeight);
    context.drawImage(image, 0, 0, attemptWidth, attemptHeight);

    const blob = await canvasToBlob(canvas, attempt.quality);
    if (blob.size > TARGET_OPENAI_IMAGE_BYTES) continue;

    const dataUrl = await readFileAsDataUrl(blob);
    const [, base64 = ''] = dataUrl.split(',');
    if (!base64) throw new Error("Impossible de convertir l'image.");
    if (getDecodedByteLengthFromBase64(base64) > MAX_OPENAI_IMAGE_BYTES) continue;

    return {
      mediaType: 'image/jpeg',
      data: base64,
    };
  }

  throw new Error("L'image est trop lourde. Réduis-la ou prends une capture plus légère.");
}

export async function prepareChatAttachment(file: File): Promise<ChatAttachment> {
  const mediaType = file.type || 'application/octet-stream';
  const id = `${file.name}-${file.size}-${file.lastModified}-${crypto.randomUUID()}`;

  if (mediaType.startsWith('image/')) {
    const image = await prepareImageForOpenAi(file);
    return {
      id,
      name: file.name,
      mediaType: image.mediaType,
      kind: 'image',
      data: image.data,
      size: file.size,
    };
  }

  if (mediaType === 'application/pdf' || file.name.toLowerCase().endsWith('.pdf')) {
    if (file.size > MAX_DOCUMENT_BYTES) {
      throw new Error(`${file.name} est trop lourd. Maximum: 4.5 Mo.`);
    }

    const dataUrl = await readFileAsDataUrl(file);
    const [, base64 = ''] = dataUrl.split(',');
    if (!base64) throw new Error(`Impossible de lire ${file.name}.`);

    return {
      id,
      name: file.name,
      mediaType: 'application/pdf',
      kind: 'pdf',
      data: base64,
      size: file.size,
    };
  }

  const isTextLike =
    mediaType.startsWith('text/') ||
    /\.(txt|md|csv|json|ts|tsx|js|jsx|html|css)$/i.test(file.name);

  if (isTextLike) {
    const text = await readFileAsText(file);
    return {
      id,
      name: file.name,
      mediaType: mediaType.startsWith('text/') ? mediaType : 'text/plain',
      kind: 'text',
      text: text.slice(0, MAX_TEXT_CHARS),
      size: file.size,
    };
  }

  throw new Error(`${file.name} n'est pas supporté. Utilise une image, un PDF ou un fichier texte.`);
}
