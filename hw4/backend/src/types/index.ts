import { Request } from 'express';

// ==================== Enums ====================

export enum TreasureType {
  MUSIC = 'music',
  AUDIO = 'audio',
  TEXT = 'text',
  LINK = 'link',
  LIVE_MOMENT = 'live_moment'
}

// ==================== Database Types ====================

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId?: string; // 改為 optional
  password?: string; // 新增密碼欄位
  createdAt: Date;
  updatedAt: Date;
}

export interface Treasure {
  id: string;
  userId: string;
  title: string;
  content: string;
  type: TreasureType;
  latitude: number;
  longitude: number;
  address?: string;
  mediaUrl?: string;
  linkUrl?: string;
  isLiveLocation: boolean;
  locationRadius: number;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  createdAt: Date;
  updatedAt: Date;
}

// ==================== DTOs ====================

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatar?: string | null;
}

export interface CreateUserDTO {
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
}

// ==================== Auth Request Types ====================

export interface RegisterRequest {
  email: string;
  name: string;
  password: string;
  avatar?: string;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface GoogleOAuthRequest {
  googleToken: string;
}

export interface CreateTreasureDTO {
  title: string;
  content: string;
  type: TreasureType;
  latitude: number;
  longitude: number;
  address?: string;
  linkUrl?: string;
  tags: string[];
  isLiveLocation?: boolean;
}

export interface UpdateTreasureDTO {
  title?: string;
  content?: string;
  tags?: string[];
  linkUrl?: string;
}

export interface TreasureDTO {
  id: string;
  title: string;
  content: string;
  type: TreasureType;
  latitude: number;
  longitude: number;
  address?: string;
  mediaUrl?: string;
  linkUrl?: string;
  isLiveLocation: boolean;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  createdAt: string;
  user: UserDTO;
}

export interface TreasureDetailDTO extends TreasureDTO {
  comments: CommentDTO[];
}

export interface CommentDTO {
  id: string;
  content: string;
  createdAt: string;
  user: UserDTO;
}

export interface CreateCommentDTO {
  content: string;
}

// ==================== Query Types ====================

export interface TreasureQuery {
  latitude?: number;
  longitude?: number;
  radius?: number; // 公里
  type?: TreasureType;
  tags?: string[];
  userId?: string;
  page?: number;
  limit?: number;
}

// ==================== API Response Types ====================

export interface ApiResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiError {
  success: false;
  error: {
    code: string;
    message: string;
    details?: unknown;
  };
}

export interface PaginatedResponse<T> {
  success: true;
  data: T[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  };
}

// ==================== Auth Types ====================

export interface LoginRequest {
  googleToken: string;
}

export interface LoginResponse {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

export interface JWTPayload {
  userId: string;
  email: string;
  iat?: number;
  exp?: number;
}

export interface GoogleUserInfo {
  id: string;
  email: string;
  name: string;
  picture?: string;
}

// ==================== Express Extensions ====================

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email: string;
    name: string;
  };
}

// ==================== Upload Types ====================

export interface UploadedFile {
  filename: string;
  originalname: string;
  mimetype: string;
  size: number;
  path: string;
}

// ==================== Location Types ====================

export interface LocationBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface DistanceQuery {
  fromLat: number;
  fromLng: number;
  toLat: number;
  toLng: number;
}

// ==================== Validation Types ====================

export interface ValidationError {
  field: string;
  message: string;
  value?: unknown;
}

// ==================== Service Response Types ====================

export interface ServiceResult<T> {
  success: boolean;
  data?: T;
  error?: string;
  errors?: ValidationError[];
}