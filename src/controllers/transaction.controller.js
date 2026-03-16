
import Transaction from '../models/Transaction.js';
import User from '../models/User.js';

// Get transactions for a user (placeholder or existing)
export const getTransactions = async (req, res) => {
    // ... existing implementation if any, or create a simple getter
    try {
        const transactions = await Transaction.find({ user: req.user.id }).sort({ createdAt: -1 });
        res.status(200).json(transactions);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const createOrder = async (req, res) => {
    try {
        const { plan } = req.body;
        const newTransaction = new Transaction({
            user: req.user._id,
            planName: plan === 'premium' ? 'Premium Subscription' : 'Basic Plan',
            currency: 'VND',
            status: 'process',
            durationDays: 30, // Default to 30 days for now
            amount: 49000
        });

        await newTransaction.save();
        res.status(201).json({ id: newTransaction._id });
    } catch (error) {
        console.error('Create order error:', error);
        res.status(500).json({ message: 'Lỗi tạo đơn hàng' });
    }
};

export const checkStatus = async (req, res) => {
    try {
        const { id } = req.params;
        const transaction = await Transaction.findById(id);
        if (!transaction) {
            return res.status(404).json({ message: 'Không tìm thấy đơn hàng' });
        }
        res.json({ status: transaction.status });
    } catch (error) {
        console.error('Check status error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const addTransactionCallback = async (req, res) => {
    try {
        const {
            id, // SePay transaction ID
            gateway,
            transactionDate,
            accountNumber,
            code,
            content,
            transferType,
            transferAmount,
            accumulated,
            subAccount,
            referenceCode,
            description
        } = req.body;

        console.log("Received payment callback:", req.body);

        // 1. Validate transferType (must be 'in')
        if (transferType !== 'in') {
            return res.status(200).json({ message: 'Ignored outgoing transaction' });
        }

        // 2. Extract Transaction ID from content
        // The description sent usually looks like: {fullName} - stumentalhealth - {transactionId}
        // Banks might convert to uppercase and remove spaces, but the 24-hex-character MongoDB ObjectId will be preserved.
        const textToSearch = (content || '') + " " + (description || '');
        const match = textToSearch.match(/([a-fA-F0-9]{24})/);

        let transaction;

        if (match) {
            const transactionId = match[1];
            transaction = await Transaction.findById(transactionId);
        }

        if (!transaction) {
            console.log("Transaction not found for content:", content);
            // If not found by ID, maybe we shouldn't fail completely if we want to support the old way? 
            // but the prompt is specific about the new flow.
            // I'll assume we strictly follow the new flow for new transactions.
            return res.status(200).json({ success: true, message: 'Transaction id not found in content' });
        }


        if (transaction.status === 'completed') {
            return res.status(200).json({ success: true, message: 'Transaction already processed' });
        }

        // 3. Find User from Transaction
        const user = await User.findById(transaction.user);
        if (!user) {
            console.log("User not found for transaction:", transaction._id);
            return res.status(200).json({ message: 'User not found' });
        }

        // 4. Update Transaction with SePay info
        transaction.status = 'completed';
        transaction.sepayTransactionId = id;
        transaction.gateway = gateway;
        transaction.transactionDate = transactionDate;
        transaction.accountNumber = accountNumber;
        transaction.code = code;
        transaction.content = content;
        transaction.transferType = transferType;
        transaction.transferAmount = transferAmount;
        transaction.accumulated = accumulated;
        transaction.subAccount = subAccount;
        transaction.referenceCode = referenceCode;
        transaction.description = description;

        await transaction.save();

        // 5. Update User Premium Status
        const durationDays = transaction.durationDays || 30;
        const now = new Date();
        let newPremiumUntil;

        if (user.isPremium && user.premiumUntil && new Date(user.premiumUntil) > now) {
            // Extend existing
            const currentExpiry = new Date(user.premiumUntil);
            currentExpiry.setDate(currentExpiry.getDate() + durationDays);
            newPremiumUntil = currentExpiry;
        } else {
            // New subscription
            const expiry = new Date();
            expiry.setDate(expiry.getDate() + durationDays);
            newPremiumUntil = expiry;
        }

        user.isPremium = true;
        user.premiumUntil = newPremiumUntil;
        await user.save();

        console.log(`Updated premium for user ${user.email} until ${newPremiumUntil}`);

        return res.status(200).json({ success: true, message: 'Transaction processed successfully' });
    } catch (error) {
        console.error('Callback processing error:', error);
        return res.status(500).json({ message: 'Internal Server Error' });
    }
};