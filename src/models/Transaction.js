
import mongoose from 'mongoose';

const transactionSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true,
    },
    planName: {
        type: String,
        required: true,
    },
    currency: {
        type: String,
        default: 'VND',
    },
    amount: {
        type: Number,
        required: true,
    },
    status: {
        type: String,
        enum: ['pending', 'completed', 'failed', 'process'],
        default: 'process',
    },
    durationDays: {
        type: Number,
        required: true,
    },
    // SePay specific fields
    sepayTransactionId: { type: Number }, // id
    gateway: { type: String },
    transactionDate: { type: String },
    accountNumber: { type: String },
    code: { type: String, default: null },
    content: { type: String },
    transferType: { type: String },
    transferAmount: { type: Number },
    accumulated: { type: Number },
    subAccount: { type: String, default: null },
    referenceCode: { type: String },
    description: { type: String },
    createdAt: {
        type: Date,
        default: Date.now,
    }
}, {
    timestamps: true,
});

const Transaction = mongoose.model('Transaction', transactionSchema);

export default Transaction;
