const notificationService = require("../services/notificationservice");
const notificationRepo = require("../repositories/notificationRepository");
const AppError = require("../utils/AppError");

async function getNotifications(req, res, next) {
  try {
    const userId = req.user.id;
    const notifications = await notificationRepo.getNotificationsByUser(userId);
    res.json(notifications);
  } catch (error) {
    console.error("Error fetching notifications:", error.message);
    next(error);
    // res.status(500).json({ message: "Failed to fetch notifications" });
  }
}

async function markAsRead(req, res, next) {
  try {
    const userId = req.user.id;
    const notificationId = parseInt(req.params.id);

    if (!notificationId) {
      return next(new AppError("Notification ID is required", 400));
      // return res.status(400).json({ message: "Notification ID is required" });
    }

    const notification = await notificationRepo.getNotificationById(
      notificationId
    );

    if (!notification || notification.userId !== userId) {
      return next(new AppError("Notification not found", 404));
      // return res.status(404).json({ message: "Notification not found" });
    }

    await notification.update({ isRead: true });

    res.json({ message: "Notification marked as read" });
  } catch (error) {
    console.error("Error marking notification as read:", error.message);
    next(error);
    // res.status(500).json({ message: "Failed to update notification" });
  }
}

module.exports = {
  getNotifications,
  markAsRead,
};
