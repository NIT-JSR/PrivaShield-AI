// Constants for permission names and risk levels

export const RISK_LEVELS = {
  LOW: 'low',
  MEDIUM: 'medium',
  HIGH: 'high',
  UNKNOWN: 'unknown',
};

export const PERMISSION_TYPES = {
  LOCATION: 'location',
  CAMERA: 'camera',
  MICROPHONE: 'microphone',
  CONTACTS: 'contacts',
  STORAGE: 'storage',
  NOTIFICATIONS: 'notifications',
  COOKIES: 'cookies',
  PERSONAL_DATA: 'personal_data',
  THIRD_PARTY: 'third_party',
};

export const PERMISSION_NAMES = {
  [PERMISSION_TYPES.LOCATION]: 'Location Access',
  [PERMISSION_TYPES.CAMERA]: 'Camera Access',
  [PERMISSION_TYPES.MICROPHONE]: 'Microphone Access',
  [PERMISSION_TYPES.CONTACTS]: 'Contacts Access',
  [PERMISSION_TYPES.STORAGE]: 'Storage Access',
  [PERMISSION_TYPES.NOTIFICATIONS]: 'Notifications',
  [PERMISSION_TYPES.COOKIES]: 'Cookies & Tracking',
  [PERMISSION_TYPES.PERSONAL_DATA]: 'Personal Data Collection',
  [PERMISSION_TYPES.THIRD_PARTY]: 'Third-Party Sharing',
};

export const RISK_CATEGORIES = {
  DATA_COLLECTION: 'data_collection',
  DATA_SHARING: 'data_sharing',
  DATA_RETENTION: 'data_retention',
  USER_RIGHTS: 'user_rights',
  SECURITY: 'security',
  TRACKING: 'tracking',
};
