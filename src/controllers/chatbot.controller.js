import ChatScript from '../models/ChatScript.js';
import AIUser from '../models/AIUser.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: 'You are a supportive chatbot. Always respond in a positive, encouraging, and empathetic manner.',
});

// Get available topics
export const getTopics = async (req, res) => {
    try {
        const topics = await ChatScript.find({ isActive: true }, 'topic description');
        res.json(topics);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Start chat with a topic (optional)
export const startChat = async (req, res) => {
    try {
        console.log('startChat called');
        console.log('req.body:', req.body);
        const { topic } = req.body;
        let message = 'Xin chào, tôi ở đây để lắng nghe bạn.';

        if (topic) {
            console.log('Topic requested:', topic);
            const script = await ChatScript.findOne({ topic, isActive: true });
            if (script) {
                const firstMessage = script.steps.find(step => step.role === 'assistant');
                if (firstMessage) message = firstMessage.content;
            } else {
                console.log('Script not found for topic:', topic);
            }
        }

        res.json({ message });
    } catch (error) {
        console.error('Error in startChat:', error);
        res.status(500).json({ message: 'Lỗi server', error: error.message });
    }
};

// Send message using Gemini AI
export const sendMessage = async (req, res) => {
    try {
        const { message } = req.body;
        const userId = req.user._id;

        let aiUser = await AIUser.findOne({ user: userId });
        if (!aiUser) {
            aiUser = new AIUser({ user: userId, messages: [] });
        }

        // Check daily limit (10 messages per day for free users)
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        const tomorrow = new Date(today);
        tomorrow.setDate(tomorrow.getDate() + 1);

        const todayMessages = aiUser.messages.filter(m => m.timestamp >= today && m.timestamp < tomorrow);
        if (todayMessages.length >= 50) {
            return res.status(429).json({ message: 'Bạn đã đạt giới hạn 50 tin nhắn/ngày. Nâng cấp tài khoản để chat không giới hạn.' });
        }

        // Add user message to history
        aiUser.messages.push({ role: 'user', content: message, timestamp: new Date() });

        // Prepare history for Gemini (exclude the current user message)
        let historyMessages = aiUser.messages.slice(0, -1);

        // Sanitize history: Ensure it doesn't end with a user message (which would cause user -> user sequence)
        // If the last message in history is 'user', it means the previous response failed or was not saved.
        // We remove it to maintain the user -> model -> user flow.
        if (historyMessages.length > 0 && historyMessages[historyMessages.length - 1].role === 'user') {
            historyMessages.pop();
        }

        const history = historyMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        // Start chat with history
        const chat = model.startChat({ history });

        // Send the user message to get response
        const result = await chat.sendMessage(message);
        const response = result.response.text();

        // Add assistant response to history
        aiUser.messages.push({ role: 'assistant', content: response, timestamp: new Date() });

        // Save to database
        await aiUser.save();

        res.json({ response });
    } catch (error) {
        console.error('Error in sendMessage:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Get chat history
export const getChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        const aiUser = await AIUser.findOne({ user: userId });

        if (!aiUser) {
            return res.json([]);
        }

        res.json(aiUser.messages);
    } catch (error) {
        console.error('Error in getChatHistory:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Clear chat history
export const clearChatHistory = async (req, res) => {
    try {
        const userId = req.user._id;
        let aiUser = await AIUser.findOne({ user: userId });

        if (aiUser) {
            aiUser.messages = [];
            await aiUser.save();
        }

        res.json({ message: 'Đã xóa lịch sử trò chuyện' });
    } catch (error) {
        console.error('Error in clearChatHistory:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

