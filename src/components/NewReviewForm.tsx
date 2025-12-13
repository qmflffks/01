import { useState } from 'react';
import { ImageUploader } from './ImageUploader';
import { useAdmin } from '../contexts/AdminContext';
import type { Review, Comment } from '../types';
import { generateId } from '../utils/imageProcessor';

interface NewReviewFormProps {
  onSubmit: (review: Review) => void;
  onCancel: () => void;
  prefillWebtoonTitle?: string;
  prefillEpisode?: string;
}

export function NewReviewForm({ onSubmit, onCancel, prefillWebtoonTitle, prefillEpisode }: NewReviewFormProps) {
  const { userNickname, user } = useAdmin();
  const [webtoonTitle, setWebtoonTitle] = useState(prefillWebtoonTitle || '');
  const [episode, setEpisode] = useState(prefillEpisode || '');
  const [imageUrls, setImageUrls] = useState<string[]>([]);
  const [firstComment, setFirstComment] = useState('');

  const handleSubmit = () => {
    if (!webtoonTitle.trim() || imageUrls.length === 0) {
      alert('웹툰 제목과 이미지는 필수입니다.');
      return;
    }

    const comments: Comment[] = firstComment.trim()
      ? [{
          id: generateId(),
          text: firstComment.trim(),
          authorNickname: userNickname || '익명',
          authorEmail: user?.email || '',
          createdAt: new Date(),
          reactions: [],
        }]
      : [];

    const review: Review = {
      id: generateId(),
      webtoonTitle: webtoonTitle.trim(),
      episode: episode.trim() || undefined,
      imageUrls,
      authorNickname: userNickname || '익명',
      authorEmail: user?.email || '',
      comments,
      createdAt: new Date(),
    };

    onSubmit(review);
  };

  const isValid = webtoonTitle.trim() && imageUrls.length > 0;

  return (
    <div className="card p-4 space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-bold text-gray-900 dark:text-white">
          새 리뷰 작성
        </h2>
        <button
          onClick={onCancel}
          className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors"
        >
          <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
          </svg>
        </button>
      </div>

      {/* 웹툰 정보 입력 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            웹툰 제목 *
          </label>
          <input
            type="text"
            value={webtoonTitle}
            onChange={(e) => setWebtoonTitle(e.target.value)}
            placeholder="예: 신의 탑"
            className="w-full px-3 py-2 text-base sm:text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
        <div>
          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
            에피소드 (선택)
          </label>
          <input
            type="text"
            value={episode}
            onChange={(e) => setEpisode(e.target.value)}
            placeholder="예: 582"
            className="w-full px-3 py-2 text-base sm:text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none"
          />
        </div>
      </div>

      {/* 이미지 업로더 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          웹툰 캡쳐 *
        </label>
        <ImageUploader onImagesProcessed={setImageUrls} />
      </div>

      {/* 첫 번째 코멘트 */}
      <div>
        <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
          첫 번째 코멘트 (선택)
        </label>
        <textarea
          value={firstComment}
          onChange={(e) => setFirstComment(e.target.value)}
          placeholder="이 장면에 대한 첫 코멘트를 남겨보세요..."
          rows={4}
          className="w-full px-3 py-2 text-base sm:text-sm bg-gray-100 dark:bg-gray-700 border-0 rounded-lg text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 outline-none resize-none"
        />
      </div>

      {/* 버튼 */}
      <div className="flex flex-col sm:flex-row gap-2 pt-2">
        <button
          onClick={handleSubmit}
          disabled={!isValid}
          className="flex-1 btn-primary disabled:opacity-50 disabled:cursor-not-allowed py-3 sm:py-2"
        >
          리뷰 등록
        </button>
        <button onClick={onCancel} className="btn-secondary py-3 sm:py-2">
          취소
        </button>
      </div>
    </div>
  );
}
