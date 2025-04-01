const Notification = require("../models/Notification")

const handleNotificationEvents = (io, socket) => {
  // Mark notification as read
  socket.on("notification:read", async ({ notificationId }) => {
    try {
      const notification = await Notification.findById(notificationId)

      if (!notification) {
        return socket.emit("error", { message: "Notification not found." })
      }

      // Check if user is the recipient
      if (!notification.recipient.equals(socket.user._id)) {
        return socket.emit("error", { message: "Not authorized to mark this notification as read." })
      }

      // Mark as read
      notification.isRead = true
      await notification.save()

      // Emit update to user
      socket.emit("notification:updated", {
        notificationId,
        isRead: true,
      })
    } catch (error) {
      console.error("Error marking notification as read:", error)
      socket.emit("error", { message: "Failed to mark notification as read." })
    }
  })

  // Get unread notifications count
  socket.on("notification:getUnreadCount", async () => {
    try {
      const count = await Notification.countDocuments({
        recipient: socket.user._id,
        isRead: false,
      })

      socket.emit("notification:unreadCount", { count })
    } catch (error) {
      console.error("Error getting unread notifications count:", error)
      socket.emit("error", { message: "Failed to get unread notifications count." })
    }
  })
}

module.exports = { handleNotificationEvents }

