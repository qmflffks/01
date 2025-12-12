import type { ImageProcessingOptions } from '../types';

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  noiseIntensity: 15,
  watermarkText: '파이',
  watermarkPosition: 'bottom-right',
  watermarkOpacity: 0.7,
};

export async function processImage(
  file: File,
  options: Partial<ImageProcessingOptions> = {}
): Promise<string> {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      img.onload = () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');

        if (!ctx) {
          reject(new Error('Canvas context not available'));
          return;
        }

        canvas.width = img.width;
        canvas.height = img.height;

        // 원본 이미지 그리기
        ctx.drawImage(img, 0, 0);

        // 노이즈 적용
        applyNoise(ctx, canvas.width, canvas.height, opts.noiseIntensity);

        // 워터마크 적용
        applyWatermark(ctx, canvas.width, canvas.height, opts);

        // 결과 반환
        resolve(canvas.toDataURL('image/jpeg', 0.9));
      };

      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = e.target?.result as string;
    };

    reader.onerror = () => reject(new Error('Failed to read file'));
    reader.readAsDataURL(file);
  });
}

function applyNoise(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  intensity: number
): void {
  const imageData = ctx.getImageData(0, 0, width, height);
  const data = imageData.data;

  for (let i = 0; i < data.length; i += 4) {
    const noise = (Math.random() - 0.5) * intensity;
    data[i] = Math.min(255, Math.max(0, data[i] + noise)); // R
    data[i + 1] = Math.min(255, Math.max(0, data[i + 1] + noise)); // G
    data[i + 2] = Math.min(255, Math.max(0, data[i + 2] + noise)); // B
  }

  ctx.putImageData(imageData, 0, 0);
}

function applyWatermark(
  ctx: CanvasRenderingContext2D,
  width: number,
  height: number,
  options: ImageProcessingOptions
): void {
  const { watermarkText, watermarkPosition, watermarkOpacity } = options;

  // 폰트 크기 계산 (이미지 크기에 비례)
  const fontSize = Math.max(16, Math.min(width, height) * 0.04);

  ctx.save();

  // 워터마크 스타일 설정
  ctx.globalAlpha = watermarkOpacity;
  ctx.font = `bold ${fontSize}px 'Pretendard', 'Noto Sans KR', sans-serif`;

  // 텍스트 크기 측정
  const textMetrics = ctx.measureText(`@${watermarkText}`);
  const textWidth = textMetrics.width;
  const textHeight = fontSize;

  // 패딩
  const padding = fontSize * 0.8;

  // 위치 계산
  let x: number, y: number;
  switch (watermarkPosition) {
    case 'top-left':
      x = padding;
      y = padding + textHeight;
      break;
    case 'top-right':
      x = width - textWidth - padding;
      y = padding + textHeight;
      break;
    case 'bottom-left':
      x = padding;
      y = height - padding;
      break;
    case 'bottom-right':
    default:
      x = width - textWidth - padding;
      y = height - padding;
      break;
  }

  // 배경 (반투명 박스)
  const boxPadding = fontSize * 0.3;
  ctx.fillStyle = 'rgba(0, 0, 0, 0.5)';
  ctx.fillRect(
    x - boxPadding,
    y - textHeight,
    textWidth + boxPadding * 2,
    textHeight + boxPadding
  );

  // 텍스트 그리기
  ctx.fillStyle = 'white';
  ctx.fillText(`@${watermarkText}`, x, y);

  ctx.restore();
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
