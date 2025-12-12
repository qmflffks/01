import { useState, useCallback } from 'react';
import { ImageEditor } from './ImageEditor';
import { processImage } from '../utils/imageProcessor';
import { uploadImage } from '../utils/storage';

interface CommentImageUploaderProps {
  userNickname: string;
  onImageProcessed: (storageUrl: string) => void;
  onCancel: () => void;
}

type WatermarkPosition = 'center' | 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';

export function CommentImageUploader({ userNickname, onImageProcessed, onCancel }: CommentImageUploaderProps) {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [croppedImage, setCroppedImage] = useState<string | null>(null);
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [watermarkPosition, setWatermarkPosition] = useState<WatermarkPosition>('bottom-right');
  const [isProcessing, setIsProcessing] = useState(false);
  const [step, setStep] = useState<'select' | 'crop' | 'preview'>('select');

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      alert('이미지 파일만 업로드 가능합니다.');
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImage(result);
      setStep('crop');
    };
    reader.readAsDataURL(file);
  };

  const handleCrop = async (croppedDataUrl: string) => {
    setCroppedImage(croppedDataUrl);
    setIsProcessing(true);

    try {
      // 자른 이미지를 워터마크와 노이즈로 처리
      const response = await fetch(croppedDataUrl);
      const blob = await response.blob();
      const file = new File([blob], 'cropped.jpg', { type: 'image/jpeg' });

      const processedDataUrl = await processImage(file, {
        noiseIntensity: 10,
        watermarkText: userNickname,
        watermarkPosition: 'bottom-right',
        watermarkOpacity: 0.5,
      });

      setPreviewImage(processedDataUrl);
      setStep('preview');
    } catch (error) {
      console.error('Image processing failed:', error);
      alert('이미지 처리에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleChangeWatermark = useCallback(async (position: WatermarkPosition) => {
    if (!croppedImage) return;
    setWatermarkPosition(position);
    setIsProcessing(true);

    try {
      const response = await fetch(croppedImage);
      const blob = await response.blob();
      const file = new File([blob], 'reprocess.jpg', { type: 'image/jpeg' });

      const processedDataUrl = await processImage(file, {
        noiseIntensity: 10,
        watermarkText: userNickname,
        watermarkPosition: position,
        watermarkOpacity: 0.5,
      });

      setPreviewImage(processedDataUrl);
    } catch (error) {
      console.error('Watermark change failed:', error);
      alert('워터마크 변경에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  }, [croppedImage, userNickname]);

  const handleConfirm = async () => {
    if (!previewImage) return;

    setIsProcessing(true);
    try {
      const storageUrl = await uploadImage(previewImage, 'comment');
      if (storageUrl) {
        onImageProcessed(storageUrl);
      } else {
        alert('이미지 업로드에 실패했습니다.');
      }
    } catch (error) {
      console.error('Upload failed:', error);
      alert('이미지 업로드에 실패했습니다.');
    } finally {
      setIsProcessing(false);
    }
  };

  if (step === 'select') {
    return (
      <div className="space-y-2">
        <input
          type="file"
          accept="image/*"
          onChange={handleFileSelect}
          className="hidden"
          id="comment-image-input"
        />
        <div className="flex gap-2">
          <label
            htmlFor="comment-image-input"
            className="flex-1 px-4 py-2 text-center bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors cursor-pointer"
          >
            📎 이미지 선택
          </label>
          <button
            onClick={onCancel}
            className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-300 dark:hover:bg-gray-600 transition-colors"
          >
            취소
          </button>
        </div>
      </div>
    );
  }

  if (step === 'crop' && originalImage) {
    return (
      <ImageEditor
        imageUrl={originalImage}
        onCrop={handleCrop}
        onCancel={() => {
          setOriginalImage(null);
          setStep('select');
        }}
      />
    );
  }

  if (step === 'preview' && previewImage) {
    return (
      <div className="fixed inset-0 bg-black/90 z-50 flex items-center justify-center p-4">
        <div className="max-w-2xl w-full bg-white dark:bg-gray-800 rounded-xl overflow-hidden">
          <div className="p-4 border-b border-gray-200 dark:border-gray-700">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">
              댓글 이미지 미리보기
            </h2>
          </div>

          <div className="p-4 space-y-4">
            {/* 이미지 미리보기 */}
            <div className="bg-gray-100 dark:bg-gray-900 rounded-lg p-4 flex items-center justify-center">
              <img
                src={previewImage}
                alt="미리보기"
                className="max-w-full max-h-[50vh] object-contain"
              />
            </div>

            {/* 워터마크 위치 선택 */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                워터마크 위치 선택
              </label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  onClick={() => handleChangeWatermark('top-left')}
                  disabled={isProcessing}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    watermarkPosition === 'top-left'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  ↖ 좌상단
                </button>
                <button
                  onClick={() => handleChangeWatermark('top-right')}
                  disabled={isProcessing}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    watermarkPosition === 'top-right'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  ↗ 우상단
                </button>
                <button
                  onClick={() => handleChangeWatermark('center')}
                  disabled={isProcessing}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    watermarkPosition === 'center'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  ⊙ 중앙
                </button>
                <button
                  onClick={() => handleChangeWatermark('bottom-left')}
                  disabled={isProcessing}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    watermarkPosition === 'bottom-left'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  ↙ 좌하단
                </button>
                <button
                  onClick={() => handleChangeWatermark('bottom-right')}
                  disabled={isProcessing}
                  className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors ${
                    watermarkPosition === 'bottom-right'
                      ? 'bg-primary-500 text-white'
                      : 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-300 dark:hover:bg-gray-600'
                  } disabled:opacity-50`}
                >
                  ↘ 우하단
                </button>
              </div>
            </div>
          </div>

          <div className="p-4 flex justify-end gap-3 border-t border-gray-200 dark:border-gray-700">
            <button
              onClick={() => {
                setStep('crop');
                setPreviewImage(null);
              }}
              disabled={isProcessing}
              className="px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
            >
              다시 자르기
            </button>
            <button
              onClick={handleConfirm}
              disabled={isProcessing}
              className="px-4 py-2 bg-primary-500 hover:bg-primary-600 text-white rounded-lg transition-colors disabled:opacity-50"
            >
              {isProcessing ? '업로드 중...' : '확인'}
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
