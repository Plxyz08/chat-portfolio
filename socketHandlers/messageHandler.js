const Message = require("../models/Message")
const Notification = require("../models/Notification")

const handleMessageEvents = (io, socket) => {
  // Mark messages as read
  socket.on("message:read", async ({ messageId }) => {
    try {
      const message = await Message.findById(messageId)

      if (!message) {
        return socket.emit("error", { message: "Message not found." })
      }

      // Check if message is already marked as read by this user
      const alreadyRead = message.readBy.some((read) => read.user.equals(socket.user._id))

      if (!alreadyRead) {
        // Add user to readBy array
        await Message.findByIdAndUpdate(messageId, {
          $push: {
            readBy: {
              user: socket.user._id,
              readAt: new Date(),
            },
          },
        })

        // Emit read receipt to sender
        if (message.isPrivate) {
          io.to(`user:${message.sender}`).emit("message:readReceipt", {
            messageId,
            userId: socket.user._id,
            readAt: new Date(),
          })
        } else {
          io.to(`room:${message.room}`).emit("message:readReceipt", {
            messageId,
            userId: socket.user._id,
            readAt: new Date(),
          })
        }
      }
    } catch (error) {
      console.error("Error marking message as read:", error)
      socket.emit("error", { message: "Failed to mark message as read." })
    }
  })

  // User typing in private chat
  socket.on("message:typing", ({ recipientId, isTyping }) => {
    io.to(`user:${recipientId}`).emit("message:userTyping", {
      userId: socket.user._id,
      username: socket.user.username,
      isTyping,
    })
  })
}

module.exports = { handleMessageEvents }

