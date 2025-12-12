import { useState, useRef, useEffect } from 'react';
import type { CropArea } from '../types';

interface ImageEditorProps {
  imageUrl: string;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | null;

export function ImageEditor({ imageUrl, onCrop, onCancel }: ImageEditorProps) {
  const [cropArea, setCropArea] = useState<CropArea>({ x: 0, y: 0, width: 0, height: 0 });
  const [imageSize, setImageSize] = useState({ width: 0, height: 0 });
  const [activeHandle, setActiveHandle] = useState<ResizeHandle>(null);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0, cropArea: { x: 0, y: 0, width: 0, height: 0 } });
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const imageRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (imageRef.current) {
      const img = imageRef.current;
      setImageSize({ width: img.naturalWidth, height: img.naturalHeight });

      // 초기 자르기 영역 설정 (전체 이미지)
      setCropArea({
        x: 0,
        y: 0,
        width: img.naturalWidth,
        height: img.naturalHeight,
      });
    }
  }, [imageUrl]);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    if (!imageRef.current) return { x: 0, y: 0 };

    const rect = imageRef.current.getBoundingClientRect();
    const scaleX = imageSize.width / rect.width;
    const scaleY = imageSize.height / rect.height;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left) * scaleX,
      y: (clientY - rect.top) * scaleY,
    };
  };

  const handleStart = (e: React.MouseEvent | React.TouchEvent, handle: ResizeHandle) => {
    e.preventDefault();
    e.stopPropagation();

    const coords = getCoordinates(e);
    setActiveHandle(handle);
    setDragStart({
      x: coords.x,
      y: coords.y,
      cropArea: { ...cropArea },
    });
  };

  const handleMove = (e: React.MouseEvent | React.TouchEvent) => {
    if (!activeHandle || !imageRef.current) return;
    e.preventDefault();

    const coords = getCoordinates(e);
    const dx = coords.x - dragStart.x;
    const dy = coords.y - dragStart.y;

    let newCrop = { ...dragStart.cropArea };

    switch (activeHandle) {
      case 'tl': // 좌상단
        newCrop.x = Math.max(0, Math.min(dragStart.cropArea.x + dx, dragStart.cropArea.x + dragStart.cropArea.width - 50));
        newCrop.y = Math.max(0, Math.min(dragStart.cropArea.y + dy, dragStart.cropArea.y + dragStart.cropArea.height - 50));
        newCrop.width = dragStart.cropArea.width - (newCrop.x - dragStart.cropArea.x);
        newCrop.height = dragStart.cropArea.height - (newCrop.y - dragStart.cropArea.y);
        break;
      case 'tr': // 우상단
        newCrop.y = Math.max(0, Math.min(dragStart.cropArea.y + dy, dragStart.cropArea.y + dragStart.cropArea.height - 50));
        newCrop.width = Math.max(50, Math.min(dragStart.cropArea.width + dx, imageSize.width - dragStart.cropArea.x));
        newCrop.height = dragStart.cropArea.height - (newCrop.y - dragStart.cropArea.y);
        break;
      case 'bl': // 좌하단
        newCrop.x = Math.max(0, Math.min(dragStart.cropArea.x + dx, dragStart.cropArea.x + dragStart.cropArea.width - 50));
        newCrop.width = dragStart.cropArea.width - (newCrop.x - dragStart.cropArea.x);
        newCrop.height = Math.max(50, Math.min(dragStart.cropArea.height + dy, imageSize.height - dragStart.cropArea.y));
        break;
      case 'br': // 우하단
        newCrop.width = Math.max(50, Math.min(dragStart.cropArea.width + dx, imageSize.width - dragStart.cropArea.x));
        newCrop.height = Math.max(50, Math.min(dragStart.cropArea.height + dy, imageSize.height - dragStart.cropArea.y));
        break;
      case 't': // 상단
        newCrop.y = Math.max(0, Math.min(dragStart.cropArea.y + dy, dragStart.cropArea.y + dragStart.cropArea.height - 50));
        newCrop.height = dragStart.cropArea.height - (newCrop.y - dragStart.cropArea.y);
        break;
      case 'b': // 하단
        newCrop.height = Math.max(50, Math.min(dragStart.cropArea.height + dy, imageSize.height - dragStart.cropArea.y));
        break;
      case 'l': // 좌측
        newCrop.x = Math.max(0, Math.min(dragStart.cropArea.x + dx, dragStart.cropArea.x + dragStart.cropArea.width - 50));
        newCrop.width = dragStart.cropArea.width - (newCrop.x - dragStart.cropArea.x);
        break;
      case 'r': // 우측
        newCrop.width = Math.max(50, Math.min(dragStart.cropArea.width + dx, imageSize.width - dragStart.cropArea.x));
        break;
    }

    setCropArea(newCrop);
  };

  const handleEnd = () => {
    setActiveHandle(null);
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

  const handleStyle = "w-8 h-8 bg-white border-2 border-primary-500 rounded-full shadow-lg touch-manipulation";
  const edgeHandleStyle = "bg-primary-500/50 touch-manipulation";

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            이미지 자르기
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            핸들을 드래그하여 영역을 조절하세요
          </p>
        </div>

        <div
          className="relative overflow-visible max-h-[60vh] bg-gray-100 dark:bg-gray-900 p-8"
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          <div className="overflow-auto max-h-[calc(60vh-4rem)]">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Edit"
              className="max-w-full h-auto mx-auto select-none"
              draggable={false}
            />

            {/* 자르기 영역 및 핸들 */}
            {cropArea.width > 0 && cropArea.height > 0 && (
              <div
                className="absolute border-2 border-primary-500 z-10"
                style={getCropStyle()}
              >
                {/* 반투명 오버레이 (선택된 영역 외부) */}
                <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.5)] pointer-events-none" />

                {/* 그리드 라인 */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/30" />
                  ))}
                </div>

                {/* 모서리 핸들 */}
                <div
                  className={`absolute -left-4 -top-4 ${handleStyle} cursor-nwse-resize z-20`}
                  onMouseDown={(e) => handleStart(e, 'tl')}
                  onTouchStart={(e) => handleStart(e, 'tl')}
                />
                <div
                  className={`absolute -right-4 -top-4 ${handleStyle} cursor-nesw-resize z-20`}
                  onMouseDown={(e) => handleStart(e, 'tr')}
                  onTouchStart={(e) => handleStart(e, 'tr')}
                />
                <div
                  className={`absolute -left-4 -bottom-4 ${handleStyle} cursor-nesw-resize z-20`}
                  onMouseDown={(e) => handleStart(e, 'bl')}
                  onTouchStart={(e) => handleStart(e, 'bl')}
                />
                <div
                  className={`absolute -right-4 -bottom-4 ${handleStyle} cursor-nwse-resize z-20`}
                  onMouseDown={(e) => handleStart(e, 'br')}
                  onTouchStart={(e) => handleStart(e, 'br')}
                />

                {/* 변 핸들 */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -top-2 w-12 h-4 ${edgeHandleStyle} rounded cursor-ns-resize z-20`}
                  onMouseDown={(e) => handleStart(e, 't')}
                  onTouchStart={(e) => handleStart(e, 't')}
                />
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -bottom-2 w-12 h-4 ${edgeHandleStyle} rounded cursor-ns-resize z-20`}
                  onMouseDown={(e) => handleStart(e, 'b')}
                  onTouchStart={(e) => handleStart(e, 'b')}
                />
                <div
                  className={`absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-12 ${edgeHandleStyle} rounded cursor-ew-resize z-20`}
                  onMouseDown={(e) => handleStart(e, 'l')}
                  onTouchStart={(e) => handleStart(e, 'l')}
                />
                <div
                  className={`absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-12 ${edgeHandleStyle} rounded cursor-ew-resize z-20`}
                  onMouseDown={(e) => handleStart(e, 'r')}
                  onTouchStart={(e) => handleStart(e, 'r')}
                />
              </div>
            )}
          </div>
        </div>

        <canvas ref={canvasRef} className="hidden" />

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
