class NotificationService {
  constructor() {
    // Store in-memory notifications (in production, use Redis or database)
    this.inAppNotifications = new Map();
  }

  async sendInAppNotification(userId, { title, message, alertId, priority = 'normal' }) {
    try {
      const notification = {
        id: `${Date.now()}-${Math.random()}`,
        userId,
        title,
        message,
        alertId,
        priority,
        timestamp: new Date(),
        read: false
      };

      // Store notification for user
      if (!this.inAppNotifications.has(userId)) {
        this.inAppNotifications.set(userId, []);
      }
      
      const userNotifications = this.inAppNotifications.get(userId);
      userNotifications.unshift(notification);
      
      // Keep only last 100 notifications per user
      if (userNotifications.length > 100) {
        userNotifications.splice(100);
      }

      console.log(`In-app notification created for user ${userId}:`, {
        title,
        message,
        alertId
      });

      return { success: true, notificationId: notification.id };
    } catch (error) {
      console.error('Error creating in-app notification:', error);
      return { success: false, error: error.message };
    }
  }

  async getNotifications(userId, { limit = 20, unreadOnly = false } = {}) {
    const userNotifications = this.inAppNotifications.get(userId) || [];
    
    let filtered = userNotifications;
    if (unreadOnly) {
      filtered = userNotifications.filter(n => !n.read);
    }
    
    return filtered.slice(0, limit);
  }

  async markAsRead(userId, notificationId) {
    const userNotifications = this.inAppNotifications.get(userId) || [];
    const notification = userNotifications.find(n => n.id === notificationId);
    
    if (notification) {
      notification.read = true;
      return { success: true };
    }
    
    return { success: false, error: 'Notification not found' };
  }

  async markAllAsRead(userId) {
    const userNotifications = this.inAppNotifications.get(userId) || [];
    userNotifications.forEach(n => n.read = true);
    return { success: true, count: userNotifications.length };
  }

  async clearNotifications(userId) {
    this.inAppNotifications.delete(userId);
    return { success: true };
  }

  async getUnreadCount(userId) {
    const userNotifications = this.inAppNotifications.get(userId) || [];
    return userNotifications.filter(n => !n.read).length;
  }
}

module.exports = NotificationService;