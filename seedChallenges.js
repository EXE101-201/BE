import 'dotenv/config';
import mongoose from 'mongoose';
import Challenge from './src/models/Challenge.js';
import { connectDB } from './src/config/db.js';

const challenges = [
    {
        title: "Ngủ sớm 7 ngày",
        description: "Nên ngủ trước 11h",
        duration: 7,
        icon: "/Thuthach.png",
        participants: 5,
        completedCount: 5
    },
    {
        title: "Ngồi thiền 10p",
        description: "Hãy tập trung nhé!!",
        duration: 7,
        icon: "/Thuthach2.png",
        participants: 9,
        completedCount: 3
    },
    {
        title: "Uống 2lít nước mỗi ngày",
        description: "nước rất quan trọng cho cơ thể!",
        duration: 7,
        icon: "/Thuthach3.png",
        participants: 15,
        completedCount: 2
    },
    {
        title: "Tập thể dục 15p",
        description: "Cùng vươn vai nào",
        duration: 7,
        icon: "/Thuthach4.png",
        participants: 5,
        completedCount: 5
    },
    {
        title: "Không dùng điện thoại 15 phút trước khi ngủ",
        description: "Ngủ dễ hơn cực nhiều.",
        duration: 7,
        icon: "/Thuthach5.png",
        participants: 12,
        completedCount: 4
    },
    {
        title: "Tâm sự cùng Dr. MTH",
        description: "Có áp lực hãy nói với tôi!",
        duration: 7,
        icon: "/Thuthach9.png",
        participants: 20,
        completedCount: 10
    },
    {
        title: "Viết lại 1 ngày của bạn thế nào?",
        description: "Cùng chia sẻ nào !",
        duration: 7,
        icon: "/Thuthach7.png",
        participants: 8,
        completedCount: 2
    },
    {
        title: "Thư giãn cùng âm nhạc",
        description: "Thư giãn chút nào !",
        duration: 7,
        icon: "/Thuthach8.png",
        participants: 18,
        completedCount: 6
    }

];

const seedChallenges = async () => {
    try {
        await connectDB();
        await Challenge.deleteMany();
        await Challenge.insertMany(challenges);
        console.log('Challenges seeded successfully');
        process.exit();
    } catch (error) {
        console.error('Error seeding challenges:', error);
        process.exit(1);
    }
};

seedChallenges();
