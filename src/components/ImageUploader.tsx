import { useState, useRef, useCallback } from 'react';
import { processImage } from '../utils/imageProcessor';
import { ImageEditor } from './ImageEditor';
import { useAdmin } from '../contexts/AdminContext';

interface ImageUploaderProps {
  onImageProcessed: (imageUrl: string) => void;
}

export function ImageUploader({ onImageProcessed }: ImageUploaderProps) {
  const { userNickname } = useAdmin();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback(async (file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    // 원본 이미지를 먼저 불러와서 편집기에 표시
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImage(result);
      setShowEditor(true);
    };
    reader.readAsDataURL(file);
  }, []);

  const handleCrop = useCallback(async (croppedImageUrl: string) => {
    setShowEditor(false);
    setIsProcessing(true);

    try {
      // Crop된 이미지를 Blob으로 변환
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });

      // 노이즈 + 워터마크 처리
      const processedImage = await processImage(file, {
        noiseIntensity: 15,
        watermarkText: userNickname || '익명',
        watermarkPosition: 'center',
        watermarkOpacity: 0.7,
      });

      setPreview(processedImage);
      onImageProcessed(processedImage);
    } catch (error) {
      console.error('Image processing failed:', error);
      alert('이미지 처리에 실패했습니다.');
    } finally {
      setIsProcessing(false);
      setOriginalImage(null);
    }
  }, [userNickname, onImageProcessed]);

  const handleCancelEdit = useCallback(() => {
    setShowEditor(false);
    setOriginalImage(null);
  }, []);

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);

    const file = e.dataTransfer.files[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const handleFileInput = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleFile(file);
  }, [handleFile]);

  const clearPreview = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  return (
    <>
      <div className="space-y-3">
        {!preview ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`
              border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all
              ${isDragging
                ? 'border-primary-500 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-300 dark:border-gray-600 hover:border-primary-400 hover:bg-gray-50 dark:hover:bg-gray-800'
              }
              ${isProcessing ? 'opacity-50 pointer-events-none' : ''}
            `}
          >
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleFileInput}
              className="hidden"
            />

            {isProcessing ? (
              <div className="flex flex-col items-center gap-3">
                <div className="w-10 h-10 border-4 border-primary-500 border-t-transparent rounded-full animate-spin" />
                <p className="text-gray-600 dark:text-gray-400">
                  노이즈 및 워터마크 적용 중...
                </p>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">🖼️</div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  웹툰 캡쳐를 드래그하거나 클릭해서 업로드
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  이미지 자르기 → 자동으로 노이즈 + 워터마크(@{userNickname || '익명'})가 적용됩니다
                </p>
                <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  (저용량으로 최적화되어 업로드됩니다)
                </p>
              </>
            )}
          </div>
        ) : (
          <div className="relative">
            <img
              src={preview}
              alt="Preview"
              className="w-full rounded-xl border border-gray-200 dark:border-gray-700"
            />
            <button
              onClick={clearPreview}
              className="absolute top-2 right-2 p-1.5 bg-black/50 hover:bg-black/70 text-white rounded-full transition-colors"
            >
              <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        )}
      </div>

      {/* 이미지 편집기 */}
      {showEditor && originalImage && (
        <ImageEditor
          imageUrl={originalImage}
          onCrop={handleCrop}
          onCancel={handleCancelEdit}
        />
      )}
    </>
  );
}
