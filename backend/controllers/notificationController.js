const Notification = require('../models/Notification');

const getMyNotifications = async (req, res) => {
  try {
    const notifications = await Notification.find({
      $or: [
        { recipient: req.user._id },
        { recipientRole: req.user.role }
      ]
    }).sort({ createdAt: -1 }).limit(50);
    res.json(notifications);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const markAsRead = async (req, res) => {
  try {
    await Notification.updateMany(
      { 
        _id: { $in: req.body.ids },
        $or: [
          { recipient: req.user._id },
          { recipientRole: req.user.role }
        ]
      },
      { read: true }
    );
    res.json({ message: 'Notifications marked as read' });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
};

const createNotification = async (data) => {
  try {
    const notification = new Notification(data);
    await notification.save();
    return notification;
  } catch (err) {
    console.error('Failed to create notification:', err);
  }
};

module.exports = { getMyNotifications, markAsRead, createNotification };
