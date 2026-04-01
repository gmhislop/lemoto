export class NotificationService {
  private static instance: NotificationService;
  
  static getInstance(): NotificationService {
    if (!NotificationService.instance) {
      NotificationService.instance = new NotificationService();
    }
    return NotificationService.instance;
  }

  async requestPermission(): Promise<NotificationPermission> {
    if ('Notification' in window) {
      const permission = await Notification.requestPermission();
      return permission;
    }
    throw new Error('Notifications not supported');
  }

  async registerServiceWorker(): Promise<ServiceWorkerRegistration> {
    if ('serviceWorker' in navigator) {
      const registration = await navigator.serviceWorker.register('/sw.js');
      return registration;
    }
    throw new Error('Service Workers not supported');
  }

  async subscribeToPush(registration: ServiceWorkerRegistration): Promise<PushSubscription | null> {
    try {
      const subscription = await registration.pushManager.subscribe({
        userVisibleOnly: true,
        applicationServerKey: this.urlBase64ToUint8Array(
          process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY || ''
        )
      });
      return subscription;
    } catch (error) {
      console.error('Failed to subscribe to push notifications:', error);
      return null;
    }
  }

  private urlBase64ToUint8Array(base64String: string): Uint8Array {
    const padding = '='.repeat((4 - base64String.length % 4) % 4);
    const base64 = (base64String + padding)
      .replace(/\-/g, '+')
      .replace(/_/g, '/');

    const rawData = window.atob(base64);
    const outputArray = new Uint8Array(rawData.length);

    for (let i = 0; i < rawData.length; ++i) {
      outputArray[i] = rawData.charCodeAt(i);
    }
    return outputArray;
  }

  async sendLocalNotification(title: string, body: string, data?: any): Promise<void> {
    if ('Notification' in window && Notification.permission === 'granted') {
      new Notification(title, {
        body,
        icon: '/icon-192x192.png',
        data
      });
    }
  }

  async initializeNotifications(): Promise<{ success: boolean; subscription?: PushSubscription }> {
    try {
      const permission = await this.requestPermission();
      
      if (permission !== 'granted') {
        return { success: false };
      }

      const registration = await this.registerServiceWorker();
      const subscription = await this.subscribeToPush(registration);
      
      if (subscription) {
        // Send subscription to your server
        await fetch('/api/notifications/subscribe', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ subscription })
        });
      }

      return { success: true, subscription: subscription || undefined };
    } catch (error) {
      console.error('Failed to initialize notifications:', error);
      return { success: false };
    }
  }
}