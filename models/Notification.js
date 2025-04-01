const mongoose = require("mongoose")

const NotificationSchema = new mongoose.Schema(
  {
    recipient: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    sender: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
    },
    type: {
      type: String,
      enum: ["message", "mention", "room_invite", "system"],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    relatedTo: {
      model: {
        type: String,
        enum: ["Message", "Room", "User"],
      },
      id: {
        type: mongoose.Schema.Types.ObjectId,
      },
    },
    isRead: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  },
)

module.exports = mongoose.model("Notification", NotificationSchema)

