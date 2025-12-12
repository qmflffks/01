import { useState, useRef, useEffect } from 'react';
import type { CropArea } from '../types';

interface ImageEditorProps {
  imageUrl: string;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

export function ImageEditor({ imageUrl, onCrop, onCancel }: ImageEditorProps) {
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });

      // 초기 자르기 영역 설정 (중앙 80%)
      const margin = 0.1;
      setCropArea({
        x: img.naturalWidth * margin,
        y: img.naturalHeight * margin,
        width: img.naturalWidth * (1 - 2 * margin),
        height: img.naturalHeight * (1 - 2 * margin),
      });
    }
  }, [imageUrl]);

  const handleMouseDown = (e: React.MouseEvent) => {
    if (!imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;

    const x = (e.clientX - rect.left) * scaleX;
    const y = (e.clientY - rect.top) * scaleY;

    setIsDragging(true);
    setDragStart({ x, y });
    setCropArea({ x, y, width: 0, height: 0 });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging || !imageRef.current) return;

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;

    const currentX = (e.clientX - rect.left) * scaleX;
    const currentY = (e.clientY - rect.top) * scaleY;

    const width = currentX - dragStart.x;
    const height = currentY - dragStart.y;

    setCropArea({
      x: width < 0 ? currentX : dragStart.x,
      y: height < 0 ? currentY : dragStart.y,
      width: Math.abs(width),
      height: Math.abs(height),
    });
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleCrop = () => {
    if (!canvasRef.current || !imageRef.current) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    canvas.width = cropArea.width;
    canvas.height = cropArea.height;

    const img = new Image();
    img.onload = () => {
      ctx.drawImage(
        img,
        cropArea.x,
        cropArea.y,
        cropArea.width,
        cropArea.height,
        0,
        0,
        cropArea.width,
        cropArea.height
      );

      const croppedUrl = canvas.toDataURL('image/jpeg', 0.9);
      onCrop(croppedUrl);
    };
    img.src = imageUrl;
  };

  const getCropStyle = () => {
    if (!imageRef.current) return {};

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = rect.width / imageSize.width;
    const scaleY = rect.height / imageSize.height;

    return {
      left: `${cropArea.x * scaleX}px`,
      top: `${cropArea.y * scaleY}px`,
      width: `${cropArea.width * scaleX}px`,
      height: `${cropArea.height * scaleY}px`,
    };
  };

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            이미지 자르기
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            드래그하여 자를 영역을 선택하세요
          </p>
        </div>

        <div
          ref={containerRef}
          className="relative overflow-auto max-h-[60vh] bg-gray-100 dark:bg-gray-900"
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
        >
          <img
            ref={imageRef}
            src={imageUrl}
            alt="Edit"
            className="max-w-full h-auto mx-auto select-none"
            draggable={false}
          />

          {/* 자르기 영역 표시 */}
          {cropArea.width > 0 && cropArea.height > 0 && (
            <div
              className="absolute border-2 border-primary-500 bg-primary-500/20"
              style={getCropStyle()}
            >
              <div className="absolute inset-0 border border-white/50" />
            </div>
          )}

          <canvas ref={canvasRef} className="hidden" />
        </div>

        <div className="p-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={onCancel}
            className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            취소
          </button>
          <button
            onClick={handleCrop}
            disabled={cropArea.width === 0 || cropArea.height === 0}
            className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            자르기
          </button>
        </div>
      </div>
    </div>
  );
}
