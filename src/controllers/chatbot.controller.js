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
        if (historyMessages.length > 0 && historyMessages[historyMessages.length - 1].role === 'user') {
            historyMessages.pop();
        }

        const history = historyMessages.map(m => ({
            role: m.role === 'assistant' ? 'model' : 'user',
            parts: [{ text: m.content }],
        }));

        // Dynamically build system instruction based on user premium status
        let baseInstruction = `You are a supportive, empathetic, and encouraging chatbot for a mental health platform called "Stu.Mental Health".

CONTEXTUAL AWARENESS:
- You MUST remember previous details the user shared.
- Refer back to earlier statements to show you are listening.
- Maintain continuity in your support.

RESPONSE STYLE (CRITICAL):
- Answer intelligently but CONCISELY (1 cách thông minh và ngắn gọn hơn).
- Keep your answers brief, around 2-3 sentences max unless explaining a complex topic.

RESPONSE FORMAT:
Your response MUST be in strictly valid JSON format exactly like this: {"content": "your response here", "expression": "neutral"}

EMOTIONAL GUIDELINES:
- "happy": USE THIS when the user says they feel better, share a win, or thank you warmly. Be visibly joyful for their progress!
- "sad": Use when they share deep pain or loss.
- "empathetic": Your standard mode for listening and validating.
- "surprised": For unexpected breakthroughs.
- "thinking": For deep analysis.
- "neutral": For facts, nothing more.

CRITICAL: Do NOT include any text outside the JSON block. Return ONLY the JSON.`;

        // Wait to import Activity dynamically or ensure it's imported at the top. It's not imported at the top, so let's import it here.
        const Activity = (await import('../models/Activity.js')).default;

        if (req.user.isPremium) {
            // Fetch recent activities for premium user
            const recentActivities = await Activity.find({ userId: userId }).sort({ createdAt: -1 }).limit(10);
            const activityDescriptions = recentActivities.map(a => {
                if (a.type === 'AI_CHAT') return `Đã chat với AI lúc ${a.createdAt.toLocaleTimeString()}`;
                if (a.type === 'LOGIN') return `Đăng nhập lúc ${a.createdAt.toLocaleTimeString()}`;
                if (a.type === 'USAGE_TIME') return `Sử dụng ${a.value} phút lúc ${a.createdAt.toLocaleTimeString()}`;
                return a.type;
            }).join(', ');

            baseInstruction += `\n\nPREMIUM USER CONTEXT (Hoạt động thời gian thực):
Người dùng này đang dùng gói Premium (49k). Dưới đây là các hoạt động gần đây của họ trên trang web của chúng ta: [ ${activityDescriptions || 'Chưa có hoạt động đáng kể'} ].
Dựa vào dữ liệu này, hãy:
- Quan sát cảm xúc của họ và có khả năng liệt kê lại những gì họ đã làm nếu họ hỏi.
- Chủ động gợi ý họ sử dụng các tính năng của trang web (như: Hỗ trợ viết bài confession để tâm trạng tốt hơn, tìm nhạc thư giãn, tìm bài tập).
- Chỉ rõ cho họ thao tác bấm vào đâu để dùng dễ dàng hơn (ví dụ: "Bạn có thể vào mục Cộng đồng để viết Confession", hoặc "Vào mục Thư viện để nghe nhạc/tìm bài tập").`;
        }

        const dynamicModel = genAI.getGenerativeModel({
            model: 'gemini-2.5-flash',
            systemInstruction: baseInstruction,
        });

        // Start chat with history using the dynamically generated model
        const chat = dynamicModel.startChat({ history });

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
                let jsonStr = jsonMatch[0]; // Take the whole matched block
                // Clean up any stray markdown inside or around
                jsonStr = jsonStr.replace(/```json|```/gi, '').trim();
                parsedResponse = JSON.parse(jsonStr);
            } else {
                throw new Error('No JSON found');
            }
        } catch (e) {
            console.error('Failed to parse Gemini response:', e.message);
            // Fallback: clean up common markdown noise
            let cleanResponse = responseRaw.replace(/```json|```/gi, '').trim();
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

                // Ensure content is safe for rendering by escaping quotes or just serving plain text
                parsedResponse = { content: responseRaw.replace(/```json|```|\{|\}/gi, '').trim(), expression: detectedExpression };
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

