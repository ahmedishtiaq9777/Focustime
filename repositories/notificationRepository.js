const { Notification } = require("../models");

async function getNotificationById(id) {
  return await Notification.findByPk(id);
}

async function getNotificationsByUser(userId) {
  try {
    const notifications = await Notification.findAll({
      where: { userId: userId, isRead: false },
      order: [["createdAt", "DESC"]],
    });
    return notifications;
  } catch (error) {
    console.error("Error fetching notifications:", error);
    throw error;
  }
}
async function createNotification({
  user_id,
  task_id,
  message,
  is_read = false,
}) {
  return await Notification.create({
    userId: user_id, // ✅ use camelCase
    taskId: task_id, // ✅ use camelCase
    message,
    is_read,
  });
}
async function getallnotification() {
  return await Notification.findAll({
    where: { isRead: false },
  });
}
async function markAsRead(id) {
  const notif = await Notification.findByPk(id);
  if (!notif) return null;
  notif.is_read = true;
  await notif.save();
  return notif;
}

async function deleteNotificationByTaskId(taskId) {
  return await Notification.destroy({
    where: { taskId },
  });
}

module.exports = {
  createNotification,
  getNotificationById,
  getNotificationsByUser,
  getallnotification,
  markAsRead,
  deleteNotificationByTaskId,
};
