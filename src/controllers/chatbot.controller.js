import ChatScript from '../models/ChatScript.js';

// Get available topics
export const getTopics = async (req, res) => {
    try {
        const topics = await ChatScript.find({ isActive: true }, 'topic description');
        res.json(topics);
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Start chat with a topic
export const startChat = async (req, res) => {
    try {
        const { topic } = req.body;
        const script = await ChatScript.findOne({ topic, isActive: true });
        if (!script) return res.status(404).json({ message: 'Topic không tồn tại' });

        // For simplicity, return the first assistant message
        const firstMessage = script.steps.find(step => step.role === 'assistant');
        res.json({ message: firstMessage ? firstMessage.content : 'Xin chào, tôi ở đây để lắng nghe bạn.' });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};

// Send message (simple echo for MVP)
export const sendMessage = async (req, res) => {
    try {
        const { message, topic } = req.body;
        // For MVP, simple response
        const responses = [
            'Tôi hiểu cảm xúc của bạn. Bạn không một mình.',
            'Hãy thử thư giãn bằng cách hít thở sâu.',
            'Nếu cần hỗ trợ chuyên nghiệp, hãy liên hệ với chuyên gia.',
        ];
        const randomResponse = responses[Math.floor(Math.random() * responses.length)];
        res.json({ response: randomResponse });
    } catch (error) {
        res.status(500).json({ message: 'Lỗi server' });
    }
};