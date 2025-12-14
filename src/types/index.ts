export interface Review {
  id: string;
  webtoonTitle: string;
  episode?: string;
  imageUrls: string[]; // 다중 이미지 지원 (최대 4장)
  authorNickname: string;
  authorEmail: string;
  comments: Comment[];
  createdAt: Date;
  parentReviewId?: string; // 스레드 기능: 부모 리뷰 ID
  isSpoiler?: boolean; // 스포일러 여부
}

export interface Comment {
  id: string;
  text: string;
  imageUrl?: string; // 댓글에 첨부된 이미지 (선택)
  authorNickname: string;
  authorEmail: string;
  createdAt: Date;
  reactions: Reaction[];
  isSpoiler?: boolean; // 스포일러 여부
}

export interface Reaction {
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad';
  count: number;
}

export interface ImageProcessingOptions {
  noiseIntensity: number;
  watermarkText: string;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'center';
  watermarkOpacity: number;
}

export interface BlogSettings {
  blogTitle: string;
}

export interface UserSettings {
  nickname: string;
  email: string;
}

export interface CropArea {
  x: number;
  y: number;
  width: number;
  height: number;
}
