import { useState, useRef, useEffect } from 'react';
import type { CropArea } from '../types';

interface ImageEditorProps {
  imageUrl: string;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 'move' | null;

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

      // 초기 자르기 영역 설정 (정사각형, 가운데 배치)
      const size = Math.min(img.naturalWidth, img.naturalHeight) * 0.7;
      const x = (img.naturalWidth - size) / 2;
      const y = (img.naturalHeight - size) / 2;

      setCropArea({
        x,
        y,
        width: size,
        height: size,
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

    if (activeHandle === 'move') {
      // 이동 (정사각형 유지)
      newCrop.x = Math.max(0, Math.min(dragStart.cropArea.x + dx, imageSize.width - dragStart.cropArea.width));
      newCrop.y = Math.max(0, Math.min(dragStart.cropArea.y + dy, imageSize.height - dragStart.cropArea.height));
    } else {
      // 크기 조절 (정사각형 유지)
      const minSize = 100;
      let newSize = dragStart.cropArea.width;

      switch (activeHandle) {
        case 'tl': // 좌상단 - 왼쪽 위로 확장/축소
          newSize = Math.max(minSize, dragStart.cropArea.width - Math.max(dx, dy));
          newSize = Math.min(newSize, Math.min(dragStart.cropArea.x + dragStart.cropArea.width, dragStart.cropArea.y + dragStart.cropArea.height));
          newCrop.x = dragStart.cropArea.x + dragStart.cropArea.width - newSize;
          newCrop.y = dragStart.cropArea.y + dragStart.cropArea.height - newSize;
          newCrop.width = newSize;
          newCrop.height = newSize;
          break;

        case 'tr': // 우상단 - 오른쪽 위로 확장/축소
          newSize = Math.max(minSize, dragStart.cropArea.width + Math.max(dx, -dy));
          newSize = Math.min(newSize, Math.min(imageSize.width - dragStart.cropArea.x, dragStart.cropArea.y + dragStart.cropArea.height));
          newCrop.y = dragStart.cropArea.y + dragStart.cropArea.height - newSize;
          newCrop.width = newSize;
          newCrop.height = newSize;
          break;

        case 'bl': // 좌하단 - 왼쪽 아래로 확장/축소
          newSize = Math.max(minSize, dragStart.cropArea.width + Math.max(-dx, dy));
          newSize = Math.min(newSize, Math.min(dragStart.cropArea.x + dragStart.cropArea.width, imageSize.height - dragStart.cropArea.y));
          newCrop.x = dragStart.cropArea.x + dragStart.cropArea.width - newSize;
          newCrop.width = newSize;
          newCrop.height = newSize;
          break;

        case 'br': // 우하단 - 오른쪽 아래로 확장/축소
          newSize = Math.max(minSize, dragStart.cropArea.width + Math.min(dx, dy));
          newSize = Math.min(newSize, Math.min(imageSize.width - dragStart.cropArea.x, imageSize.height - dragStart.cropArea.y));
          newCrop.width = newSize;
          newCrop.height = newSize;
          break;
      }
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

  // 모서리 핸들: 큰 원형, 흰색 배경, 파란 테두리
  const cornerHandleStyle = "w-12 h-12 bg-white border-4 border-blue-500 rounded-full shadow-xl cursor-move z-30";

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            이미지 자르기
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            모서리를 드래그하여 크기 조절 • 안쪽을 드래그하여 위치 이동
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
          <div className="overflow-auto max-h-[calc(60vh-4rem)] relative">
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
                className="absolute border-4 border-blue-500 z-10"
                style={getCropStyle()}
              >
                {/* 반투명 오버레이 (선택된 영역 외부) */}
                <div className="absolute inset-0 shadow-[0_0_0_9999px_rgba(0,0,0,0.6)] pointer-events-none" />

                {/* 내부 이동 영역 */}
                <div
                  className="absolute inset-0 cursor-move z-10"
                  onMouseDown={(e) => handleStart(e, 'move')}
                  onTouchStart={(e) => handleStart(e, 'move')}
                />

                {/* 그리드 라인 */}
                <div className="absolute inset-0 grid grid-cols-3 grid-rows-3 pointer-events-none z-15">
                  {[...Array(9)].map((_, i) => (
                    <div key={i} className="border border-white/40" />
                  ))}
                </div>

                {/* 4개 모서리 핸들만 */}
                <div
                  className={`absolute -left-6 -top-6 ${cornerHandleStyle}`}
                  onMouseDown={(e) => handleStart(e, 'tl')}
                  onTouchStart={(e) => handleStart(e, 'tl')}
                  title="좌상단"
                />
                <div
                  className={`absolute -right-6 -top-6 ${cornerHandleStyle}`}
                  onMouseDown={(e) => handleStart(e, 'tr')}
                  onTouchStart={(e) => handleStart(e, 'tr')}
                  title="우상단"
                />
                <div
                  className={`absolute -left-6 -bottom-6 ${cornerHandleStyle}`}
                  onMouseDown={(e) => handleStart(e, 'bl')}
                  onTouchStart={(e) => handleStart(e, 'bl')}
                  title="좌하단"
                />
                <div
                  className={`absolute -right-6 -bottom-6 ${cornerHandleStyle}`}
                  onMouseDown={(e) => handleStart(e, 'br')}
                  onTouchStart={(e) => handleStart(e, 'br')}
                  title="우하단"
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
