// ==================== Domain Types ====================

export enum TreasureType {
  MUSIC = 'music',
  AUDIO = 'audio', 
  TEXT = 'text',
  LINK = 'link',
  LIVE_MOMENT = 'live_moment'
}

export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  googleId: string;
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
  user: User;
  likes: Like[];
  comments: Comment[];
  favorites: Favorite[];
}

export interface Like {
  id: string;
  userId: string;
  treasureId: string;
  createdAt: Date;
  user: User;
  treasure: Treasure;
}

export interface Comment {
  id: string;
  userId: string;
  treasureId: string;
  content: string;
  createdAt: Date;
  updatedAt: Date;
  user: User;
  treasure: Treasure;
}

export interface Favorite {
  id: string;
  userId: string;
  treasureId: string;
  createdAt: Date;
  user: User;
  treasure: Treasure;
}

export interface Collect {
  id: string;
  userId: string;
  treasureId: string;
  createdAt: Date;
  isLocked: boolean;
  user: User;
  treasure: Treasure;
}

// ==================== DTOs ====================

export interface UserDTO {
  id: string;
  email: string;
  name: string;
  avatar?: string;
}

export interface LoginRequest {
  googleToken: string;
}

export interface LoginResponse {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

export interface LoginResponse {
  user: UserDTO;
  accessToken: string;
  refreshToken: string;
}

export interface CreateTreasureRequest {
  title: string;
  content: string;
  type: TreasureType;
  latitude: number;
  longitude: number;
  address?: string;
  amount?: string;
  isPublic?: boolean;
  isHidden?: boolean;
  mediaFile?: File;
  linkUrl?: string;
  tags: string[];
  isLiveLocation?: boolean;
}

export interface UpdateTreasureRequest {
  title?: string;
  content?: string;
  tags?: string[];
  linkUrl?: string;
  amount?: string;
  isPublic?: boolean;
  isHidden?: boolean;
}

export interface TreasureQuery {
  latitude?: number;
  longitude?: number;
  radius?: number; // 搜尋半徑（公里）
  type?: TreasureType;
  tags?: string[];
  userId?: string;
  search?: string; // 模糊搜尋寶藏/碎片名稱
  page?: number;
  limit?: number;
}

export interface TreasureDTO {
  id: string;
  title: string;
  content: string;
  type: TreasureType;
  latitude: number;
  longitude: number;
  address?: string;
  amount?: string;
  isPublic?: boolean;
  isHidden?: boolean;
  mediaUrl?: string;
  linkUrl?: string;
  isLiveLocation: boolean;
  tags: string[];
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  isFavorited: boolean;
  isCollected?: boolean;
  createdAt: string;
  user: UserDTO;
}

export interface TreasureDetailDTO extends TreasureDTO {
  comments: CommentDTO[];
}

export interface CreateCommentRequest {
  content: string;
}

export interface CommentDTO {
  id: string;
  content: string;
  createdAt: string;
  user: UserDTO;
}

export interface CommentsResponse {
  comments: CommentDTO[];
  total: number;
  totalPages: number;
}

export interface CollectDTO {
  id: string;
  treasureId: string;
  createdAt: string;
  isLocked: boolean;
  treasure: TreasureDTO;
}

export interface CollectsResponse {
  collects: CollectDTO[];
  total: number;
  totalPages: number;
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

// ==================== Map Types ====================

export interface MapLocation {
  lat: number;
  lng: number;
}

export interface MapBounds {
  north: number;
  south: number;
  east: number;
  west: number;
}

export interface TreasureMarker {
  id: string;
  position: MapLocation;
  type: TreasureType;
  title: string;
  treasure: TreasureDTO;
}

// ==================== Component Props Types ====================

export interface TreasureCardProps {
  treasure: TreasureDTO;
  onLike?: (treasureId: string) => void;
  onFavorite?: (treasureId: string) => void;
  onComment?: (treasureId: string) => void;
  onEdit?: (treasure: TreasureDTO) => void;
  onDelete?: (treasureId: string) => void;
}

export interface TreasureFormProps {
  mode: 'create' | 'edit';
  creationMode?: 'treasure' | 'life_moment';
  opened: boolean;
  onClose: () => void;
  initialData?: Partial<CreateTreasureRequest>;
  onSubmit: (data: CreateTreasureRequest) => void;
  onCancel: () => void;
  isLoading?: boolean;
}

export interface MapComponentProps {
  center: MapLocation;
  zoom?: number;
  markers: TreasureMarker[];
  onMarkerClick?: (marker: TreasureMarker) => void;
  onMapClick?: (location: MapLocation) => void;
  onBoundsChanged?: (bounds: MapBounds) => void;
  height?: string;
  width?: string;
}

// ==================== Hook Types ====================

export interface UseGeolocationResult {
  location: MapLocation | null;
  error: string | null;
  loading: boolean;
  getCurrentLocation: () => Promise<MapLocation>;
}

export interface UseTreasuresResult {
  treasures: TreasureDTO[];
  loading: boolean;
  error: string | null;
  refetch: () => void;
  createTreasure: (data: CreateTreasureRequest) => Promise<TreasureDTO>;
  updateTreasure: (id: string, data: UpdateTreasureRequest) => Promise<TreasureDTO>;
  deleteTreasure: (id: string) => Promise<void>;
  likeTreasure: (id: string) => Promise<void>;
  favoriteTreasure: (id: string) => Promise<void>;
}

export interface UseAuthResult {
  user: UserDTO | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (googleToken: string) => Promise<void>;
  logout: () => void;
  refreshToken: () => Promise<void>;
}

// ==================== Store Types ====================

export interface AuthStore {
  user: UserDTO | null;
  accessToken: string | null;
  isAuthenticated: boolean;
  login: (response: LoginResponse) => void;
  logout: () => void;
  setUser: (user: UserDTO) => void;
}

export interface TreasureStore {
  treasures: TreasureDTO[];
  selectedTreasure: TreasureDetailDTO | null;
  filters: TreasureQuery;
  setTreasures: (treasures: TreasureDTO[]) => void;
  addTreasure: (treasure: TreasureDTO) => void;
  updateTreasure: (id: string, treasure: Partial<TreasureDTO>) => void;
  removeTreasure: (id: string) => void;
  setSelectedTreasure: (treasure: TreasureDetailDTO | null) => void;
  setFilters: (filters: Partial<TreasureQuery>) => void;
}

export interface MapStore {
  center: MapLocation;
  zoom: number;
  bounds: MapBounds | null;
  userLocation: MapLocation | null;
  setCenter: (center: MapLocation) => void;
  setZoom: (zoom: number) => void;
  setBounds: (bounds: MapBounds) => void;
  setUserLocation: (location: MapLocation) => void;
}

// ==================== Utility Types ====================

export type TreasureTypeInfo = {
  label: string;
  icon: string;
  color: string;
  description: string;
};

export type TreasureTypeConfig = Record<TreasureType, TreasureTypeInfo>;