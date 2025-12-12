export interface Review {
  id: string;
  webtoonTitle: string;
  episode?: string;
  imageUrl: string;
  comments: Comment[];
  createdAt: Date;
}

export interface Comment {
  id: string;
  text: string;
  createdAt: Date;
  reactions: Reaction[];
}

export interface Reaction {
  type: 'like' | 'love' | 'laugh' | 'wow' | 'sad';
  count: number;
}

export interface ImageProcessingOptions {
  noiseIntensity: number;
  watermarkText: string;
  watermarkPosition: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right';
  watermarkOpacity: number;
}

export interface Settings {
  id: string;
  blogTitle: string;
  nickname: string;
  createdAt: Date;
}
