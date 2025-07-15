const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const Message = require('../models/messageModel');
const verifyToken = require('../middleware');

// Import userSocketMap from your socket server
const { userSocketMap } = require('../socketServer');

// Get conversation between two users (excluding soft-deleted messages)
router.get('/conversation/:userId', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;

    const messages = await Message.find({
      $or: [
        { sender: currentUserId, receiver: otherUserId },
        { sender: otherUserId, receiver: currentUserId }
      ],
      deletedBy: { $ne: currentUserId } // exclude deleted for this user
    }).sort({ timestamp: 1 }).lean();

    const normalizedMessages = messages.map(msg => ({
      _id: msg._id.toString(),
      senderId: msg.sender.toString(),
      receiverId: msg.receiver.toString(),
      message: msg.message,
      isRead: msg.isRead || false,
      timestamp: msg.timestamp instanceof Date
        ? msg.timestamp.toISOString()
        : new Date(msg.timestamp).toISOString()
    }));

    res.json(normalizedMessages);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Get all conversations for current user (with online status)
router.get('/conversations', verifyToken, async (req, res) => {
  try {
    const currentUserId = mongoose.Types.ObjectId(req.user.userId);

    const conversations = await Message.aggregate([
      {
        $match: {
          $or: [
            { sender: currentUserId },
            { receiver: currentUserId }
          ],
          deletedBy: { $ne: currentUserId } // exclude deleted messages
        }
      },
      {
        $project: {
          participant: {
            $cond: [
              { $eq: ["$sender", currentUserId] },
              "$receiver",
              "$sender"
            ]
          },
          message: 1,
          timestamp: 1
        }
      },
      {
        $group: {
          _id: "$participant",
          lastMessage: { $last: { message: "$message", timestamp: "$timestamp" } }
        }
      },
      {
        $lookup: {
          from: "registers",
          localField: "_id",
          foreignField: "_id",
          as: "participant"
        }
      },
      { $unwind: "$participant" },
      {
        $project: {
          participant: {
            _id: "$participant._id",
            name: "$participant.name",
            photo: "$participant.photo",
            role: "$participant.role"
          },
          lastMessage: 1
        }
      },
      { $sort: { "lastMessage.timestamp": -1 } }
    ]);

    // Add online status
    conversations.forEach(conv => {
      const userId = conv.participant._id.toString();
      conv.isOnline = userSocketMap.hasOwnProperty(userId);
    });

    res.json(conversations);
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

// Soft delete conversation for current user
router.put('/conversation/:userId/delete', verifyToken, async (req, res) => {
  try {
    const currentUserId = req.user.userId;
    const otherUserId = req.params.userId;

    const result = await Message.updateMany(
      {
        $or: [
          { sender: currentUserId, receiver: otherUserId },
          { sender: otherUserId, receiver: currentUserId }
        ],
        deletedBy: { $ne: currentUserId } // prevent duplicate adds
      },
      {
        $addToSet: { deletedBy: currentUserId } // add user to deletedBy array
      }
    );

    res.json({ success: true, modified: result.modifiedCount });
  } catch (err) {
    res.status(500).json({ message: err.message });
  }
});

module.exports = router;