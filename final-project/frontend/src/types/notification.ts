export type NotificationType =
  | 'FRIEND_REQUEST'
  | 'FRIEND_ACCEPTED'
  | 'FRIEND_REJECTED'
  | 'EVENT_INVITE'
  | 'POKE'
  | 'NEW_MESSAGE'
  | 'EVENT_UPDATE';

export interface Notification {
  id: number;
  userId: string;
  type: NotificationType;
  title: string;
  body: string;
  data: any;
  read: boolean;
  createdAt: string;
}

