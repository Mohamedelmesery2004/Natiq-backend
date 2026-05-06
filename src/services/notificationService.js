import { Notification, User } from '../models/index.js';
import { getIO } from '../sockets/index.js';
import ApiError from '../utils/apiError.js';

class NotificationService {
  /**
   * Send a notification to an agent (from Team Leader or System)
   */
  async sendNotification({ companyId, recipientId, senderId, title, message, type = 'info', metadata = {} }) {
    // 1. Validate recipient
    const recipient = await User.findById(recipientId);
    if (!recipient) throw ApiError.notFound('Recipient agent not found');

    const sender = await User.findById(senderId);
    if (!sender) throw ApiError.notFound('Sender not found');

    // 2. Save to database
    const notification = await Notification.create({
      companyId,
      recipientId,
      senderId,
      title,
      message,
      type,
      metadata,
    });

    // 3. Send real-time notification via Socket.io
    try {
      const io = getIO();
      const payload = {
        _id: notification._id,
        title,
        message,
        type,
        senderName: sender.name,
        createdAt: notification.createdAt,
        metadata,
      };

      // Emit to the specific agent room
      io.of('/admin').to(`company:${companyId}:agent:${recipientId}`).emit('notification:new', payload);
      
      // Also emit to the general company room for any relevant listeners
      io.of('/admin').to(`company:${companyId}`).emit('notification:log', {
        ...payload,
        recipientId,
      });
    } catch (err) {
      console.error('[NotificationService] Socket emission error:', err.message);
    }

    return notification;
  }

  /**
   * Get notifications for an agent
   */
  async getAgentNotifications(companyId, agentId, query = {}) {
    const { page = 1, limit = 20, unreadOnly = false } = query;
    
    const filter = { companyId, recipientId: agentId };
    if (unreadOnly === 'true' || unreadOnly === true) {
      filter.isRead = false;
    }

    const notifications = await Notification.find(filter)
      .sort({ createdAt: -1 })
      .skip((page - 1) * limit)
      .limit(limit)
      .populate('senderId', 'name role profileImage');

    const total = await Notification.countDocuments(filter);
    const unreadCount = await Notification.countDocuments({ ...filter, isRead: false });

    return {
      notifications,
      pagination: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        pages: Math.ceil(total / limit),
      },
      unreadCount,
    };
  }

  /**
   * Mark notification as read
   */
  async markAsRead(companyId, agentId, notificationId) {
    const notification = await Notification.findOneAndUpdate(
      { _id: notificationId, companyId, recipientId: agentId },
      { isRead: true },
      { new: true }
    );
    
    if (!notification) throw ApiError.notFound('Notification not found');
    return notification;
  }

  /**
   * Mark all as read
   */
  async markAllAsRead(companyId, agentId) {
    await Notification.updateMany(
      { companyId, recipientId: agentId, isRead: false },
      { isRead: true }
    );
    return { success: true };
  }
}

export default new NotificationService();
