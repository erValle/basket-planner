export type NotificationType = 'info' | 'warn' | 'danger' | 'success';

export type AppNotification = {
  id: string;
  title: string;
  message: string;
  createdAt: string; // ISO
  type: NotificationType;
  read: boolean;
};

export type NotificationsListResponse = {
  items: AppNotification[];
};
