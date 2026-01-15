import nodemailer from 'nodemailer';

const createTransporter = () => {
    // Nếu có cấu hình SMTP trong .env, sử dụng nó
    if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        return nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: parseInt(process.env.SMTP_PORT) || 587,
            secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
            auth: {
                user: process.env.SMTP_USER,
                pass: process.env.SMTP_PASS,
            },
            // Thêm options cho FPT và các server khác
            tls: {
                // Không reject unauthorized certificate (hữu ích cho test)
                rejectUnauthorized: process.env.NODE_ENV === 'production',
            },
        });
    }

    // Nếu không có cấu hình, sử dụng mock transporter (chỉ để test, không gửi email thật)
    // Trong production, bắt buộc phải có SMTP config
    if (process.env.NODE_ENV !== 'production') {
        console.warn('⚠️  Email service: Chưa có cấu hình SMTP. Email sẽ được log ra console.');
        // Trả về một mock transporter để không bị lỗi
        return {
            sendMail: async (options) => {
                console.log('📧 [MOCK EMAIL] To:', options.to);
                console.log('📧 [MOCK EMAIL] Subject:', options.subject);
                const urlMatch = options.html.match(/href="([^"]+)"/);
                if (urlMatch) {
                    console.log('📧 [MOCK EMAIL] Reset URL:', urlMatch[1]);
                }
                return {
                    messageId: 'mock-' + Date.now(),
                    accepted: [options.to],
                };
            },
        };
    }

    // Production: throw error nếu không có config
    throw new Error('Email service chưa được cấu hình. Vui lòng cấu hình SMTP trong .env');
};

const sendEmail = async (options) => {
    const transporter = createTransporter();

    const message = {
        from: `${process.env.FROM_NAME || 'Student Mind Support'} <${process.env.EMAIL_USER}>`,
        to: options.email,
        subject: options.subject,
        text: options.message,
        html: options.html,
    };

    const info = await transporter.sendMail(message);

    console.log('Message sent: %s', info.messageId);
};

export default sendEmail;
