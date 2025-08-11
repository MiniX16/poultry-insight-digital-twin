import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { useSettings } from './SettingsContext';

interface Notification {
  id: string;
  type: 'temperature' | 'humidity' | 'co2' | 'nh3';
  value: number;
  threshold: 'min' | 'max';
  message: string;
  timestamp: Date;
  acknowledged: boolean;
}

interface NotificationContextType {
  notifications: Notification[];
  unreadCount: number;
  acknowledgeNotification: (id: string) => void;
  checkThresholds: (environmentalData: {
    temperature?: number;
    humidity?: number;
    co2?: number;
    nh3?: number;
  }) => void;
  clearAllNotifications: () => void;
}

const NotificationContext = createContext<NotificationContextType | undefined>(undefined);

interface NotificationProviderProps {
  children: ReactNode;
}

export const NotificationProvider: React.FC<NotificationProviderProps> = ({ children }) => {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const { settings } = useSettings();

  const unreadCount = notifications.filter(n => !n.acknowledged).length;

  // Cleanup old notifications (keep only last 50 or those newer than 24 hours)
  useEffect(() => {
    const cleanupInterval = setInterval(() => {
      const now = new Date().getTime();
      const oneDayAgo = now - 24 * 60 * 60 * 1000; // 24 hours

      setNotifications(prev => {
        // Keep only recent notifications or limit to 50 most recent
        const filtered = prev.filter(n => n.timestamp.getTime() > oneDayAgo);
        return filtered.slice(0, 50);
      });
    }, 30 * 60 * 1000); // Run cleanup every 30 minutes

    return () => clearInterval(cleanupInterval);
  }, []);

  const acknowledgeNotification = (id: string) => {
    setNotifications(prev => 
      prev.map(notification => 
        notification.id === id ? { ...notification, acknowledged: true } : notification
      )
    );
  };

  const clearAllNotifications = () => {
    setNotifications([]);
  };

  const createNotification = (
    type: Notification['type'],
    value: number,
    threshold: 'min' | 'max'
  ): Notification => {
    const thresholdValue = settings.notificationThresholds[type][threshold];
    const units = {
      temperature: '°C',
      humidity: '%',
      co2: 'ppm',
      nh3: 'ppm'
    };
    
    const typeLabels = {
      temperature: 'Temperatura',
      humidity: 'Humedad',
      co2: 'CO₂',
      nh3: 'NH₃'
    };

    const message = threshold === 'max' 
      ? `${typeLabels[type]} alta: ${value}${units[type]} (límite: ${thresholdValue}${units[type]})`
      : `${typeLabels[type]} baja: ${value}${units[type]} (límite: ${thresholdValue}${units[type]})`;

    return {
      id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
      type,
      value,
      threshold,
      message,
      timestamp: new Date(),
      acknowledged: false
    };
  };

  const checkThresholds = (environmentalData: {
    temperature?: number;
    humidity?: number;
    co2?: number;
    nh3?: number;
  }) => {
    if (!settings.notifications) return;

    const newNotifications: Notification[] = [];
    const now = Date.now();
    const cooldownPeriod = 5 * 60 * 1000; // 5 minutes

    // Check each environmental factor
    Object.entries(environmentalData).forEach(([key, value]) => {
      if (value === undefined || value === null) return;

      const type = key as keyof typeof settings.notificationThresholds;
      const thresholds = settings.notificationThresholds[type];

      let shouldNotify = false;
      let threshold: 'min' | 'max' | null = null;

      // Determine if value is outside thresholds
      if (value < thresholds.min) {
        shouldNotify = true;
        threshold = 'min';
      } else if (value > thresholds.max) {
        shouldNotify = true;
        threshold = 'max';
      }

      if (shouldNotify && threshold) {
        // Enhanced duplicate prevention:
        // 1. Check for recent notifications of the same type and threshold
        // 2. Also check for notifications with similar values (within 5% tolerance)
        const duplicateNotification = notifications.find(n => {
          const isRecentEnough = now - n.timestamp.getTime() < cooldownPeriod;
          const isSameTypeAndThreshold = n.type === type && n.threshold === threshold;
          const isSimilarValue = Math.abs(n.value - value) / Math.max(n.value, value) < 0.05; // 5% tolerance
          
          return isRecentEnough && isSameTypeAndThreshold && isSimilarValue;
        });

        // Also check if we're already creating a notification for this exact condition
        const alreadyCreating = newNotifications.some(n => 
          n.type === type && 
          n.threshold === threshold &&
          Math.abs(n.value - value) / Math.max(n.value, value) < 0.05
        );

        if (!duplicateNotification && !alreadyCreating) {
          newNotifications.push(createNotification(type, value, threshold));
        }
      }
    });

    if (newNotifications.length > 0) {
      setNotifications(prev => [...newNotifications, ...prev]);
      
      // Show browser notification if supported
      if ('Notification' in window && Notification.permission === 'granted') {
        newNotifications.forEach(notification => {
          new Notification('Alerta Ambiental - Pollos', {
            body: notification.message,
            icon: '/favicon.ico',
          });
        });
      }
    }
  };

  // Request notification permission on mount
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return (
    <NotificationContext.Provider value={{
      notifications,
      unreadCount,
      acknowledgeNotification,
      checkThresholds,
      clearAllNotifications
    }}>
      {children}
    </NotificationContext.Provider>
  );
};

export const useNotifications = (): NotificationContextType => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};