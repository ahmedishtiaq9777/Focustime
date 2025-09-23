const dayjs = require("dayjs");
const schedule = require("node-schedule");
const notificationdb = require("../repositories/notificationRepository"); // repo for DB ops
let ioInstance; // will be set later

function initNotificationService(io) {
  ioInstance = io;
}

/**
 * notification in DB and schedule reminder
 */
async function createAndScheduleNotification(task, userId) {
  const notificationMessage = `Reminder for task: ${task.title} scheduled for ${task.scheduled_for}`;

  // Save to DB
  const notification = await notificationdb.createNotification({
    user_id: userId,
    task_id: task.id,
    message: notificationMessage,
    is_read: false,
  });

  // Schedule reminder
  const reminderTime = dayjs(task.scheduled_for).subtract(1, "day").toDate();
  // const reminderTime = dayjs().add(10, "second").toDate(); // test

  schedule.scheduleJob(reminderTime, () => {
    console.log(`🔔 Sending reminder: ${task.title}`);
    if (ioInstance) {
      ioInstance.emit("reminder", { notification });
    }
  });

  return notification;
}

module.exports = {
  initNotificationService,
  createAndScheduleNotification,
};
