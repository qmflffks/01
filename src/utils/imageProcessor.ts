import type { ImageProcessingOptions } from '../types';

const DEFAULT_OPTIONS: ImageProcessingOptions = {
  noiseIntensity: 15,
  watermarkText: '파이',
  watermarkPosition: 'center',
  watermarkOpacity: 0.7,
};

const MAX_WIDTH = 1200; // 최대 너비 (저용량을 위해)

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

        // 리사이징 (저용량을 위해)
        let width = img.width;
        let height = img.height;

        if (width > MAX_WIDTH) {
          height = (height * MAX_WIDTH) / width;
          width = MAX_WIDTH;
        }

        canvas.width = width;
        canvas.height = height;

        // 원본 이미지 그리기 (리사이징 적용)
        ctx.drawImage(img, 0, 0, width, height);

        // 노이즈 적용
        applyNoise(ctx, canvas.width, canvas.height, opts.noiseIntensity);

        // 워터마크 적용
        applyWatermark(ctx, canvas.width, canvas.height, opts);

        // 결과 반환 (압축률 0.75로 낮춤)
        resolve(canvas.toDataURL('image/jpeg', 0.75));
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

  ctx.save();

  // 워터마크 스타일 설정
  ctx.globalAlpha = watermarkOpacity;

  // 위치에 따른 폰트 크기 및 스타일 결정
  if (watermarkPosition === 'center') {
    // 중앙 워터마크: 크게 표시
    const fontSize = Math.max(40, Math.min(width, height) * 0.12);
    ctx.font = `bold ${fontSize}px 'Pretendard', 'Noto Sans KR', sans-serif`;

    // 텍스트 크기 측정
    const text = `@${watermarkText}`;
    const textMetrics = ctx.measureText(text);
    const textWidth = textMetrics.width;
    const textHeight = fontSize;

    // 중앙 위치 계산
    const x = (width - textWidth) / 2;
    const y = (height + textHeight) / 2;

    // 배경 (반투명 박스)
    const boxPadding = fontSize * 0.4;
    ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
    ctx.fillRect(
      x - boxPadding,
      y - textHeight,
      textWidth + boxPadding * 2,
      textHeight + boxPadding
    );

    // 텍스트 그리기
    ctx.fillStyle = 'white';
    ctx.fillText(text, x, y);
  } else {
    // 모서리 워터마크: 작게 표시
    const fontSize = Math.max(16, Math.min(width, height) * 0.04);
    ctx.font = `bold ${fontSize}px 'Pretendard', 'Noto Sans KR', sans-serif`;

    // 텍스트 크기 측정
    const text = `@${watermarkText}`;
    const textMetrics = ctx.measureText(text);
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
    ctx.fillText(text, x, y);
  }

  ctx.restore();
}

export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}
