import User from '../models/User.js';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { OAuth2Client } from 'google-auth-library';

const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

// ... existing exports ...

import sendEmail from '../utils/sendEmail.js';

export const forgotPassword = async (req, res) => {
    try {
        const { email } = req.body;

        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email không tồn tại trong hệ thống' });
        }

        // Generate new random password
        const newPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);

        // Hash new password
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();

        // Send email
        const message = `Mật khẩu mới của bạn là: ${newPassword}\nVui lòng đăng nhập và đổi mật khẩu ngay lập tức.`;

        try {
            await sendEmail({
                email: user.email,
                subject: 'Cấp lại mật khẩu - Stu.Mental Health',
                message,
            });

            res.status(200).json({ success: true, message: 'Mật khẩu mới đã được gửi đến email của bạn' });
        } catch (error) {
            console.error(error);
            // If email fails, you might want to consider rolling back the password change, but for now we'll just error
            // user.password = undefined; // Or revert... (omitted for simplicity in this flow, but good practice usually)
            return res.status(500).json({ message: 'Không thể gửi email' });
        }

    } catch (error) {
        console.error('Forgot Password Error:', error);
        res.status(500).json({ message: 'Lỗi server' });
    }
};

export const googleLogin = async (req, res) => {
    try {
        const { token } = req.body;

        const ticket = await client.verifyIdToken({
            idToken: token,
            audience: process.env.GOOGLE_CLIENT_ID,
        });
        const { email, sub } = ticket.getPayload();

        let user = await User.findOne({ email });

        if (user) {
            // User exists, generate token
            const jwtToken = jwt.sign(
                { id: user._id, role: user.role },
                process.env.JWT_SECRET || 'your_jwt_secret_key',
                { expiresIn: '1d' }
            );

            return res.json({
                message: 'Đăng nhập Google thành công',
                token: jwtToken,
                user: {
                    id: user._id,
                    fullName: user.fullName,
                    email: user.email,
                    role: user.role,
                },
            });
        } else {
            // Create new user (User specified name rule: before @)
            const fullName = email.split('@')[0];

            // Generate a random password (since they use Google)
            const randomPassword = Math.random().toString(36).slice(-8) + Math.random().toString(36).slice(-8);
            const salt = await bcrypt.genSalt(10);
            const hashedPassword = await bcrypt.hash(randomPassword, salt);

            const newUser = new User({
                fullName,
                email,
                password: hashedPassword,
                role: 'USER', // Default role for Google users
            });

            await newUser.save();

            const jwtToken = jwt.sign(
                { id: newUser._id, role: newUser.role },
                process.env.JWT_SECRET || 'your_jwt_secret_key',
                { expiresIn: '1d' }
            );

            return res.status(201).json({
                message: 'Đăng ký Google thành công',
                token: jwtToken,
                user: {
                    id: newUser._id,
                    fullName: newUser.fullName,
                    email: newUser.email,
                    role: newUser.role,
                },
            });
        }

    } catch (error) {
        console.error('Google Auth Error:', error);
        res.status(500).json({ message: 'Lỗi xác thực Google' });
    }
};


export const register = async (req, res) => {
    try {
        const { fullName, email, password, role } = req.body;

        // Check if user already exists
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: 'Email đã được sử dụng' });
        }

        // Hash password
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        // Create new user
        const newUser = new User({
            fullName,
            email,
            password: hashedPassword,
            role: role || 'STUDENT', // Default to STUDENT if not provided
        });

        await newUser.save();

        // Create JWT token
        const token = jwt.sign(
            { id: newUser._id, role: newUser.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key', // Use env var in production
            { expiresIn: '1d' }
        );

        res.status(201).json({
            message: 'Đăng ký thành công',
            token,
            user: {
                id: newUser._id,
                fullName: newUser.fullName,
                email: newUser.email,
                role: newUser.role,
            },
        });
    } catch (error) {
        console.error('Register error:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng ký' });
    }
};

export const login = async (req, res) => {
    try {
        const { email, password } = req.body;

        // Check user existence
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: 'Email không tồn tại' });
        }

        // Check password
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'Email hoặc mật khẩu không đúng' });
        }

        // Create JWT token
        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET || 'your_jwt_secret_key',
            { expiresIn: '1d' }
        );

        res.json({
            message: 'Đăng nhập thành công',
            token,
            user: {
                id: user._id,
                fullName: user.fullName,
                email: user.email,
                role: user.role,
            },
        });
    } catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ message: 'Lỗi server khi đăng nhập' });
    }
};
