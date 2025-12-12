import { useState, useRef, useEffect } from 'react';
import type { CropArea } from '../types';

interface ImageEditorProps {
  imageUrl: string;
  onCrop: (croppedImageUrl: string) => void;
  onCancel: () => void;
}

type ResizeHandle = 'tl' | 'tr' | 'bl' | 'br' | 't' | 'b' | 'l' | 'r' | 'move' | null;

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

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();

    // 이미지의 실제 표시 크기 계산 (object-contain 고려)
    const naturalRatio = imageSize.width / imageSize.height;
    const containerRatio = rect.width / rect.height;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (containerRatio > naturalRatio) {
      // 이미지가 높이에 맞춰짐 (좌우 여백)
      displayHeight = rect.height;
      displayWidth = displayHeight * naturalRatio;
      offsetX = (rect.width - displayWidth) / 2;
      offsetY = 0;
    } else {
      // 이미지가 너비에 맞춰짐 (상하 여백)
      displayWidth = rect.width;
      displayHeight = displayWidth / naturalRatio;
      offsetX = 0;
      offsetY = (rect.height - displayHeight) / 2;
    }

    const scaleX = imageSize.width / displayWidth;
    const scaleY = imageSize.height / displayHeight;

    let clientX: number, clientY: number;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    return {
      x: (clientX - rect.left - offsetX) * scaleX,
      y: (clientY - rect.top - offsetY) * scaleY,
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
    const minSize = 50;

    if (activeHandle === 'move') {
      // 이동
      newCrop.x = Math.max(0, Math.min(dragStart.cropArea.x + dx, imageSize.width - dragStart.cropArea.width));
      newCrop.y = Math.max(0, Math.min(dragStart.cropArea.y + dy, imageSize.height - dragStart.cropArea.height));
    } else {
      // 자유로운 크기 조절
      switch (activeHandle) {
        case 'tl': // 좌상단
          newCrop.x = Math.max(0, Math.min(dragStart.cropArea.x + dx, dragStart.cropArea.x + dragStart.cropArea.width - minSize));
          newCrop.y = Math.max(0, Math.min(dragStart.cropArea.y + dy, dragStart.cropArea.y + dragStart.cropArea.height - minSize));
          newCrop.width = dragStart.cropArea.width - (newCrop.x - dragStart.cropArea.x);
          newCrop.height = dragStart.cropArea.height - (newCrop.y - dragStart.cropArea.y);
          break;

        case 'tr': // 우상단
          newCrop.y = Math.max(0, Math.min(dragStart.cropArea.y + dy, dragStart.cropArea.y + dragStart.cropArea.height - minSize));
          newCrop.width = Math.max(minSize, Math.min(dragStart.cropArea.width + dx, imageSize.width - dragStart.cropArea.x));
          newCrop.height = dragStart.cropArea.height - (newCrop.y - dragStart.cropArea.y);
          break;

        case 'bl': // 좌하단
          newCrop.x = Math.max(0, Math.min(dragStart.cropArea.x + dx, dragStart.cropArea.x + dragStart.cropArea.width - minSize));
          newCrop.width = dragStart.cropArea.width - (newCrop.x - dragStart.cropArea.x);
          newCrop.height = Math.max(minSize, Math.min(dragStart.cropArea.height + dy, imageSize.height - dragStart.cropArea.y));
          break;

        case 'br': // 우하단
          newCrop.width = Math.max(minSize, Math.min(dragStart.cropArea.width + dx, imageSize.width - dragStart.cropArea.x));
          newCrop.height = Math.max(minSize, Math.min(dragStart.cropArea.height + dy, imageSize.height - dragStart.cropArea.y));
          break;

        case 't': // 상단
          newCrop.y = Math.max(0, Math.min(dragStart.cropArea.y + dy, dragStart.cropArea.y + dragStart.cropArea.height - minSize));
          newCrop.height = dragStart.cropArea.height - (newCrop.y - dragStart.cropArea.y);
          break;

        case 'b': // 하단
          newCrop.height = Math.max(minSize, Math.min(dragStart.cropArea.height + dy, imageSize.height - dragStart.cropArea.y));
          break;

        case 'l': // 좌측
          newCrop.x = Math.max(0, Math.min(dragStart.cropArea.x + dx, dragStart.cropArea.x + dragStart.cropArea.width - minSize));
          newCrop.width = dragStart.cropArea.width - (newCrop.x - dragStart.cropArea.x);
          break;

        case 'r': // 우측
          newCrop.width = Math.max(minSize, Math.min(dragStart.cropArea.width + dx, imageSize.width - dragStart.cropArea.x));
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

    const img = imageRef.current;
    const rect = img.getBoundingClientRect();

    // 이미지의 실제 표시 크기 계산 (object-contain 고려)
    const naturalRatio = imageSize.width / imageSize.height;
    const containerRatio = rect.width / rect.height;

    let displayWidth, displayHeight, offsetX, offsetY;

    if (containerRatio > naturalRatio) {
      // 이미지가 높이에 맞춰짐 (좌우 여백)
      displayHeight = rect.height;
      displayWidth = displayHeight * naturalRatio;
      offsetX = (rect.width - displayWidth) / 2;
      offsetY = 0;
    } else {
      // 이미지가 너비에 맞춰짐 (상하 여백)
      displayWidth = rect.width;
      displayHeight = displayWidth / naturalRatio;
      offsetX = 0;
      offsetY = (rect.height - displayHeight) / 2;
    }

    const scaleX = displayWidth / imageSize.width;
    const scaleY = displayHeight / imageSize.height;

    return {
      left: `${cropArea.x * scaleX + offsetX}px`,
      top: `${cropArea.y * scaleY + offsetY}px`,
      width: `${cropArea.width * scaleX}px`,
      height: `${cropArea.height * scaleY}px`,
    };
  };

  // 모서리 핸들: 큰 원형, 흰색 배경, 파란 테두리
  const cornerHandleStyle = "w-12 h-12 bg-white border-4 border-blue-500 rounded-full shadow-xl cursor-move z-30";
  // 변 핸들: 작은 직사각형, 파란색 배경
  const edgeHandleStyle = "bg-blue-500/80 shadow-lg z-30";

  return (
    <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
      <div className="max-w-4xl w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 className="text-lg font-bold text-gray-900 dark:text-white">
            이미지 자르기
          </h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
            모서리/변을 드래그하여 자유롭게 크기 조절 • 안쪽을 드래그하여 위치 이동
          </p>
        </div>

        <div
          className="relative overflow-visible max-h-[60vh] bg-gray-100 dark:bg-gray-900 p-8 flex items-center justify-center"
          onMouseMove={handleMove}
          onMouseUp={handleEnd}
          onMouseLeave={handleEnd}
          onTouchMove={handleMove}
          onTouchEnd={handleEnd}
        >
          <div className="relative w-full h-full flex items-center justify-center">
            <img
              ref={imageRef}
              src={imageUrl}
              alt="Edit"
              className="max-w-full max-h-[calc(60vh-8rem)] object-contain mx-auto select-none"
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

                {/* 4개 모서리 핸들 */}
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

                {/* 4개 변 핸들 */}
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -top-2 w-16 h-4 ${edgeHandleStyle} rounded cursor-ns-resize`}
                  onMouseDown={(e) => handleStart(e, 't')}
                  onTouchStart={(e) => handleStart(e, 't')}
                  title="상단"
                />
                <div
                  className={`absolute left-1/2 -translate-x-1/2 -bottom-2 w-16 h-4 ${edgeHandleStyle} rounded cursor-ns-resize`}
                  onMouseDown={(e) => handleStart(e, 'b')}
                  onTouchStart={(e) => handleStart(e, 'b')}
                  title="하단"
                />
                <div
                  className={`absolute top-1/2 -translate-y-1/2 -left-2 w-4 h-16 ${edgeHandleStyle} rounded cursor-ew-resize`}
                  onMouseDown={(e) => handleStart(e, 'l')}
                  onTouchStart={(e) => handleStart(e, 'l')}
                  title="좌측"
                />
                <div
                  className={`absolute top-1/2 -translate-y-1/2 -right-2 w-4 h-16 ${edgeHandleStyle} rounded cursor-ew-resize`}
                  onMouseDown={(e) => handleStart(e, 'r')}
                  onTouchStart={(e) => handleStart(e, 'r')}
                  title="우측"
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
