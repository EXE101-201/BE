import mongoose from 'mongoose';
import Article from './src/models/Article.js';
import 'dotenv/config';

const seedArticle = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected to MongoDB');

        const existing = await Article.findOne({ slug: 'bi-quyet-giam-stress-hoc-tap' });
        if (existing) {
            console.log('Article already exists');
            process.exit(0);
        }

        const article = new Article({
            title: 'Bí quyết giảm stress trong mùa thi cử',
            slug: 'bi-quyet-giam-stress-hoc-tap',
            status: 'published',
            thumbnail: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?ixlib=rb-1.2.1&auto=format&fit=crop&w=1350&q=80',
            content: {
                intro: 'Áp lực học tập và thi cử luôn là gánh nặng đối với học sinh, sinh viên. Bài viết này sẽ chia sẻ những bí quyết giúp bạn giữ tinh thần thoải mái và đạt kết quả cao.',
                sections: [
                    {
                        order: 1,
                        title: '1. Lập kế hoạch học tập khoa học',
                        description: {
                            content: 'Đừng để nước đến chân mới nhảy. Hãy chia nhỏ nội dung cần học và phân bổ thời gian hợp lý.',
                            subcontent: [
                                'Sử dụng phương pháp Pomodoro',
                                'Ưu tiên những môn học khó vào buổi sáng',
                                'Dành thời gian nghỉ ngơi giữa các ca học'
                            ]
                        }
                    },
                    {
                        order: 2,
                        title: '2. Chăm sóc sức khỏe thể chất',
                        description: {
                            content: 'Một trí tuệ minh mẫn chỉ có trong một cơ thể khỏe mạnh. Đừng quên ăn uống đầy đủ và ngủ đủ giấc.',
                            subcontent: [
                                'Uống ít nhất 2 lít nước mỗi ngày',
                                'Hạn chế sử dụng caffeine quá mức',
                                'Ngủ ít nhất 6-7 tiếng mỗi ngày'
                            ]
                        }
                    }
                ],
                conclusion: 'Giảm stress không khó nếu bạn biết cách quản lý thời gian và chăm sóc bản thân. Chúc bạn có một mùa thi thành công và nhẹ nhàng!'
            },
            tags: ['Học tập', 'Stress', 'Sức khỏe tinh thần'],
            language: 'vi'
        });

        await article.save();
        console.log('Article seeded successfully');
        process.exit(0);
    } catch (error) {
        console.error('Error seeding article:', error);
        process.exit(1);
    }
};

seedArticle();
