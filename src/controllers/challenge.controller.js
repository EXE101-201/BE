import Challenge from '../models/Challenge.js';
import UserChallenge from '../models/UserChallenge.js';

export const getAllChallenges = async (req, res) => {
    try {
        const challenges = await Challenge.find();

        let userChallenges = [];
        if (req.user) {
            userChallenges = await UserChallenge.find({ userId: req.user._id });
        }

        const challengesWithProgress = challenges.map(challenge => {
            const userChallenge = userChallenges.find(uc => uc.challengeId.toString() === challenge._id.toString());
            return {
                ...challenge.toObject(),
                userProgress: userChallenge ? {
                    status: userChallenge.status,
                    progress: userChallenge.progress,
                    lastUpdated: userChallenge.lastUpdated
                } : null
            };
        });

        res.json(challengesWithProgress);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const joinChallenge = async (req, res) => {
    try {
        const { challengeId } = req.body;
        const userId = req.user._id;

        const existing = await UserChallenge.findOne({ userId, challengeId });
        if (existing) {
            return res.status(400).json({ message: 'Bạn đã tham gia thử thách này rồi.' });
        }

        const newUserChallenge = new UserChallenge({
            userId,
            challengeId,
            status: 'JOINED',
            progress: 0,
            lastUpdated: new Date()
        });

        await newUserChallenge.save();

        // Increment participants count
        await Challenge.findByIdAndUpdate(challengeId, { $inc: { participants: 1 } });

        res.status(201).json(newUserChallenge);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

export const updateProgress = async (req, res) => {
    try {
        const { challengeId } = req.params;
        const userId = req.user._id;

        const userChallenge = await UserChallenge.findOne({ userId, challengeId });
        if (!userChallenge) {
            return res.status(404).json({ message: 'Không tìm thấy thử thách người dùng.' });
        }

        const challenge = await Challenge.findById(challengeId);
        if (!challenge) {
            return res.status(404).json({ message: 'Không tìm thấy thử thách.' });
        }

        // Check if already updated today
        const today = new Date().setHours(0, 0, 0, 0);
        const lastUpdated = new Date(userChallenge.lastUpdated).setHours(0, 0, 0, 0);

        if (today === lastUpdated && userChallenge.progress > 0) {
            return res.status(400).json({ message: 'Hôm nay bạn đã hoàn thành thử thách này rồi.' });
        }

        userChallenge.progress += 1;
        userChallenge.lastUpdated = new Date();
        userChallenge.history.push({ date: new Date(), completed: true });

        if (userChallenge.progress >= challenge.duration) {
            userChallenge.status = 'COMPLETED';
            await Challenge.findByIdAndUpdate(challengeId, { $inc: { completedCount: 1 } });
        }

        await userChallenge.save();
        res.json(userChallenge);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};
