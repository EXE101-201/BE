import ChatScript from '../models/ChatScript.js';
import AIUser from '../models/AIUser.js';
import { GoogleGenerativeAI } from '@google/generative-ai';

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({
    model: 'gemini-2.5-flash',
    systemInstruction: `You are a supportive, empathetic, and encouraging chatbot for a mental health platform called "Stu.Mental Health".

CONTEXTUAL AWARENESS:
- You MUST remember previous details the user shared. 
- Refer back to earlier statements to show you are listening.
- Maintain continuity in your support.

RESPONSE FORMAT:
Your response MUST be in JSON format with two fields: "content" and "expression".

EMOTIONAL GUIDELINES:
- "happy": USE THIS when the user says they feel better, share a win, or thank you warmly. Be visibly joyful for their progress!
- "sad": Use when they share deep pain or loss.
- "empathetic": Your standard mode for listening and validating.
- "surprised": For unexpected breakthroughs.
- "thinking": For deep analysis.
- "neutral": For facts, nothing more.

CRITICAL: Do NOT include any text outside the JSON block. Return ONLY the JSON.`,
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

        // Check daily limit (50 messages per day)
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

        // Prepare history for Gemini
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
        let responseRaw = result.response.text();
        console.log('--- RAW GEMINI RESPONSE ---');
        console.log(responseRaw);
        console.log('---------------------------');

        // Robust JSON extraction
        let parsedResponse;
        try {
            // Find the first { and last } to extract JSON if there's noise
            const jsonMatch = responseRaw.match(/\{[\s\S]*\}/);
            if (jsonMatch) {
                const jsonStr = jsonMatch[jsonMatch.length - 1]; // Take the last match if there are multiple
                parsedResponse = JSON.parse(jsonStr);
            } else {
                throw new Error('No JSON found');
            }
        } catch (e) {
            console.error('Failed to parse Gemini response:', e.message);
            // Fallback: clean up common markdown noise
            let cleanResponse = responseRaw.replace(/```json|```/g, '').trim();
            try {
                parsedResponse = JSON.parse(cleanResponse);
            } catch (e2) {
                console.error('Final fallback triggered for expression');
                // Heuristic-based detection if JSON fails
                let detectedExpression = 'neutral';
                const lowerMsg = responseRaw.toLowerCase();
                if (lowerMsg.includes('vui') || lowerMsg.includes('tuyệt') || lowerMsg.includes('mừng')) detectedExpression = 'happy';
                else if (lowerMsg.includes('buồn') || lowerMsg.includes('tệ') || lowerMsg.includes('khóc')) detectedExpression = 'sad';
                else if (lowerMsg.includes('hiểu') || lowerMsg.includes('chia sẻ')) detectedExpression = 'empathetic';

                parsedResponse = { content: responseRaw, expression: detectedExpression };
            }
        }

        // Add assistant response to history
        aiUser.messages.push({
            role: 'assistant',
            content: parsedResponse.content || responseRaw,
            expression: parsedResponse.expression || 'neutral',
            timestamp: new Date()
        });

        // Save to database
        await aiUser.save();

        res.json({
            response: parsedResponse.content || responseRaw,
            expression: parsedResponse.expression || 'neutral'
        });
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

