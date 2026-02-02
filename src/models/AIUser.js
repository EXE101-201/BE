import mongoose from 'mongoose';

const aIUserSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  messages: [{
    role: {
      type: String,
      enum: ['user', 'assistant'],
      required: true,
    },
    content: {
      type: String,
      required: true,
    },
    expression: {
      type: String,
      enum: ['neutral', 'happy', 'empathetic', 'thinking', 'surprised', 'sad'],
      default: 'neutral',
    },
    timestamp: {
      type: Date,
      default: Date.now,
    },
  }],
});

const AIUser = mongoose.model('AIUser', aIUserSchema);

export default AIUser;