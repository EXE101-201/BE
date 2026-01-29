import mongoose from 'mongoose';

const userSchema = new mongoose.Schema({
  fullName: {
    type: String,
    required: true,
    trim: true,
  },
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: false,
    trim: true,
  },
  role: {
    type: String,
    enum: ['ADMIN', 'USER'],
    required: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  isPremium: {
    type: Boolean,
    default: false,
  },
  premiumUntil: {
    type: Date,
    default: null,
  },
  anonymous: {
    name: { type: String, default: null },
    id: {
      type: mongoose.Schema.Types.ObjectId,
      default: () => new mongoose.Types.ObjectId()
    },
  },
  hasUsedTrial: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: false,
});

const User = mongoose.model('User', userSchema);

export default User;

