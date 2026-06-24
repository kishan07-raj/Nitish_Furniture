const mongoose = require('mongoose');

const supportTicketSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
    index: true,
  },
  name: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
  },
  phone: {
    type: String,
    trim: true,
    default: '',
  },
  intent: {
    type: String,
    required: true,
    index: true,
  },
  subject: {
    type: String,
    required: true,
    trim: true,
  },
  description: {
    type: String,
    required: true,
  },
  conversationHistory: [{
    role: { type: String, enum: ['user', 'ai'] },
    text: String,
    timestamp: { type: Date, default: Date.now },
  }],
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  emotionScore: {
    frustration: { type: Number, default: 0 },
    confusion: { type: Number, default: 0 },
  },
  assignedTo: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: false,
  },
  resolution: {
    type: String,
    default: '',
  },
  resolvedAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for common queries
supportTicketSchema.index({ createdAt: -1 });
supportTicketSchema.index({ status: 1, priority: -1 });
supportTicketSchema.index({ email: 1 });

module.exports = mongoose.model('SupportTicket', supportTicketSchema);
