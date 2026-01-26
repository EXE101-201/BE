import mongoose from 'mongoose';
import ChatScript from './src/models/ChatScript.js';
import 'dotenv/config';

const seedChatScript = async () => {
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        console.log('Connected to MongoDB');

        const scripts = [
            {
                topic: 'Mình đang stress vì học',
                description: 'Hỗ trợ giảm stress học tập',
                steps: [
                    { role: 'assistant', content: 'Tôi hiểu bạn đang cảm thấy áp lực với việc học. Hãy chia sẻ thêm về những gì đang làm bạn stress nhé.' },
                    { role: 'assistant', content: 'Hãy thử bài thở sâu: Hít vào 4 giây, giữ 4 giây, thở ra 4 giây. Lặp lại 5 lần.' },
                    { role: 'assistant', content: 'Bạn có thể chia nhỏ công việc học thành các phần nhỏ hơn và nghỉ ngơi giữa các phiên.' }
                ]
            },
            {
                topic: 'Mình mất động lực',
                description: 'Giúp khôi phục động lực',
                steps: [
                    { role: 'assistant', content: 'Mất động lực là điều bình thường. Hãy nhớ lại lý do ban đầu bạn bắt đầu con đường này.' },
                    { role: 'assistant', content: 'Hãy đặt mục tiêu nhỏ mỗi ngày và thưởng cho bản thân khi hoàn thành.' },
                    { role: 'assistant', content: 'Thiền ngắn 5 phút có thể giúp bạn tập trung lại.' }
                ]
            },
            {
                topic: 'Mình khó ngủ',
                description: 'Giải quyết vấn đề mất ngủ',
                steps: [
                    { role: 'assistant', content: 'Mất ngủ có thể do stress. Hãy tạo thói quen ngủ đều đặn.' },
                    { role: 'assistant', content: 'Tránh sử dụng màn hình 1 giờ trước khi ngủ và uống trà thảo mộc.' },
                    { role: 'assistant', content: 'Thử nghe nhạc nhẹ hoặc âm thanh tự nhiên để thư giãn.' }
                ]
            }
        ];

        for (const scriptData of scripts) {
            const existing = await ChatScript.findOne({ topic: scriptData.topic });
            if (!existing) {
                const script = new ChatScript(scriptData);
                await script.save();
                console.log(`Seeded script: ${scriptData.topic}`);
            } else {
                console.log(`Script already exists: ${scriptData.topic}`);
            }
        }

        console.log('ChatScript seeding completed');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding ChatScript:', error);
        process.exit(1);
    }
};

seedChatScript();