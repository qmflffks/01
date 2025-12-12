import { useState, useRef, useCallback } from 'react';
import { processImage } from '../utils/imageProcessor';
import { uploadImage } from '../utils/storage';
import { ImageEditor } from './ImageEditor';
import { useAdmin } from '../contexts/AdminContext';

interface ImageUploaderProps {
  onImagesProcessed: (imageUrls: string[]) => void;
}

interface ProcessedImage {
  id: string;
  dataUrl: string;
  storageUrl?: string;
}

const MAX_IMAGES = 4;

export function ImageUploader({ onImagesProcessed }: ImageUploaderProps) {
  const { userNickname } = useAdmin();
  const [isDragging, setIsDragging] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);
  const [processedImages, setProcessedImages] = useState<ProcessedImage[]>([]);
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [currentFile, setCurrentFile] = useState<File | null>(null);
  const [showEditor, setShowEditor] = useState(false);
  const [showPreview, setShowPreview] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFile = useCallback((file: File) => {
    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    if (processedImages.length >= MAX_IMAGES) {
      alert(`최대 ${MAX_IMAGES}장까지만 업로드 가능합니다.`);
      return;
    }

    // 원본 이미지를 먼저 불러와서 선택 화면 표시
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImage(result);
      setCurrentFile(file);
    };
    reader.readAsDataURL(file);
  }, [processedImages.length]);

  const handleCrop = useCallback(async (croppedImageUrl: string) => {
    setShowEditor(false);
    setIsProcessing(true);

    try {
      // Crop된 이미지를 Blob으로 변환
      const response = await fetch(croppedImageUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });

      // 노이즈 + 워터마크 처리
      const processedDataUrl = await processImage(file, {
        noiseIntensity: 15,
        watermarkText: userNickname || '익명',
        watermarkPosition: 'center',
        watermarkOpacity: 0.7,
      });

      // 미리보기 표시
      setPreviewImage(processedDataUrl);
      setShowPreview(true);
    } catch (error) {
      console.error('Image processing failed:', error);
      alert('이미지 처리에 실패했습니다.');
    } finally {
      setIsProcessing(false);
      setOriginalImage(null);
      setCurrentFile(null);
    }
  }, [userNickname]);

  const handleSkipCrop = useCallback(async () => {
    if (!originalImage || !currentFile) return;
    setIsProcessing(true);

    try {
      // 원본 이미지를 Blob으로 변환
      const response = await fetch(originalImage);
      const blob = await response.blob();
      const file = new File([blob], 'original.jpg', { type: 'image/jpeg' });

      // 노이즈 + 워터마크 처리 (자르기 없이)
      const processedDataUrl = await processImage(file, {
        noiseIntensity: 15,
        watermarkText: userNickname || '익명',
        watermarkPosition: 'center',
        watermarkOpacity: 0.7,
      });

      // 미리보기 표시
      setPreviewImage(processedDataUrl);
      setShowPreview(true);
    } catch (error) {
      console.error('Image processing failed:', error);
      alert('이미지 처리에 실패했습니다.');
    } finally {
      setIsProcessing(false);
      setOriginalImage(null);
      setCurrentFile(null);
    }
  }, [originalImage, currentFile, userNickname]);

  const handleConfirmPreview = useCallback(async () => {
    if (!previewImage) return;
    setIsProcessing(true);

    try {
      // Supabase Storage에 업로드
      const storageUrl = await uploadImage(previewImage, 'image');

      if (!storageUrl) {
        alert('이미지 업로드에 실패했습니다.');
        return;
      }

      // 처리된 이미지 목록에 추가
      const newImage: ProcessedImage = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        dataUrl: previewImage,
        storageUrl,
      };

      const updatedImages = [...processedImages, newImage];
      setProcessedImages(updatedImages);

      // 부모 컴포넌트에 전달
      onImagesProcessed(updatedImages.map(img => img.storageUrl!));

      setShowPreview(false);
      setPreviewImage(null);
    } catch (error) {
      console.error('Image upload failed:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [previewImage, processedImages, onImagesProcessed]);

  const handleRetakePreview = useCallback(() => {
    setShowPreview(false);
    setPreviewImage(null);
    if (fileInputRef.current) {
      fileInputRef.current.click();
    }
  }, []);

  const handleCancelEdit = useCallback(() => {
    setShowEditor(false);
    setOriginalImage(null);
    setCurrentFile(null);
  }, []);

  const handleCancelPreview = useCallback(() => {
    setShowPreview(false);
    setPreviewImage(null);
  }, []);

  const removeImage = useCallback((id: string) => {
    const updatedImages = processedImages.filter(img => img.id !== id);
    setProcessedImages(updatedImages);
    onImagesProcessed(updatedImages.map(img => img.storageUrl!));
  }, [processedImages, onImagesProcessed]);

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
    // input 초기화
    e.target.value = '';
  }, [handleFile]);

  return (
    <>
      <div className="space-y-3">
        {/* 이미지 업로드 영역 */}
        {processedImages.length < MAX_IMAGES && (
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
                  처리 중... (100kb 이하로 압축 + 워터마크)
                </p>
              </div>
            ) : (
              <>
                <div className="text-4xl mb-3">🖼️</div>
                <p className="text-gray-600 dark:text-gray-400 font-medium">
                  웹툰 캡쳐를 드래그하거나 클릭해서 업로드
                </p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">
                  {processedImages.length} / {MAX_IMAGES}장 • 100kb 이하로 압축 • 워터마크(@{userNickname || '익명'})
                </p>
              </>
            )}
          </div>
        )}

        {/* 업로드된 이미지 목록 (그리드) */}
        {processedImages.length > 0 && (
          <div className="grid grid-cols-2 gap-3">
            {processedImages.map((img, index) => (
              <div key={img.id} className="relative group">
                <img
                  src={img.dataUrl}
                  alt={`Image ${index + 1}`}
                  className="w-full aspect-square object-cover rounded-xl border border-gray-200 dark:border-gray-700"
                />
                <button
                  onClick={() => removeImage(img.id)}
                  className="absolute top-2 right-2 p-1.5 bg-black/70 hover:bg-black/90 text-white rounded-full transition-colors opacity-0 group-hover:opacity-100"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
                <div className="absolute bottom-2 left-2 px-2 py-1 bg-black/70 text-white text-xs rounded">
                  {index + 1}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* 자르기 선택 화면 */}
      {originalImage && !showEditor && !showPreview && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                이미지 업로드
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                이미지를 자를까요?
              </p>
            </div>

            <div className="p-4">
              <img
                src={originalImage}
                alt="Preview"
                className="max-w-full max-h-[50vh] mx-auto rounded-lg object-contain"
              />
            </div>

            <div className="p-4 flex gap-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={() => setShowEditor(true)}
                className="flex-1 btn-primary py-3"
              >
                ✂️ 자르기
              </button>
              <button
                onClick={handleSkipCrop}
                disabled={isProcessing}
                className="flex-1 btn-secondary py-3 disabled:opacity-50"
              >
                {isProcessing ? '처리 중...' : '바로 업로드'}
              </button>
              <button
                onClick={handleCancelEdit}
                className="px-4 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 이미지 편집기 */}
      {showEditor && originalImage && (
        <ImageEditor
          imageUrl={originalImage}
          onCrop={handleCrop}
          onCancel={handleCancelEdit}
        />
      )}

      {/* 미리보기 확인 화면 */}
      {showPreview && previewImage && (
        <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
          <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
            <div className="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">
                미리보기 확인
              </h2>
              <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                이 이미지를 업로드할까요?
              </p>
            </div>

            <div className="p-4 bg-gray-100 dark:bg-gray-900">
              <img
                src={previewImage}
                alt="Preview"
                className="max-w-full max-h-[50vh] mx-auto rounded-lg object-contain"
              />
            </div>

            <div className="p-4 flex gap-3 border-t border-gray-200 dark:border-gray-700">
              <button
                onClick={handleConfirmPreview}
                disabled={isProcessing}
                className="flex-1 btn-primary py-3 disabled:opacity-50"
              >
                {isProcessing ? '업로드 중...' : '✓ 업로드'}
              </button>
              <button
                onClick={handleRetakePreview}
                disabled={isProcessing}
                className="flex-1 btn-secondary py-3 disabled:opacity-50"
              >
                다시 선택
              </button>
              <button
                onClick={handleCancelPreview}
                disabled={isProcessing}
                className="px-4 py-3 text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 disabled:opacity-50"
              >
                취소
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
