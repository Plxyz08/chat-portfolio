const jwt = require("jsonwebtoken")
const User = require("../models/User")

// Middleware for authenticating API requests
const authenticateToken = async (req, res, next) => {
  try {
    const authHeader = req.headers["authorization"]
    const token = authHeader && authHeader.split(" ")[1]

    if (!token) {
      return res.status(401).json({ message: "Access denied. No token provided." })
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return res.status(404).json({ message: "User not found." })
    }

    req.user = user
    next()
  } catch (error) {
    return res.status(403).json({ message: "Invalid token." })
  }
}

// Middleware for authenticating socket connections
const authenticateSocket = async (socket, next) => {
  try {
    const token = socket.handshake.auth.token

    if (!token) {
      return next(new Error("Authentication error: No token provided."))
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(decoded.userId)

    if (!user) {
      return next(new Error("Authentication error: User not found."))
    }

    socket.user = user
    next()
  } catch (error) {
    return next(new Error("Authentication error: Invalid token."))
  }
}

module.exports = { authenticateToken, authenticateSocket }

