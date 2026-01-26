
import axios from 'axios';
import mongoose from 'mongoose';
import User from './src/models/User.js';
import 'dotenv/config';

const TEST_EMAIL = 'debug_tester@example.com';
const TEST_PASSWORD = 'password123';
const API_URL = 'http://localhost:4000/api';

async function run() {
    console.log('--- Starting API Debug (Full Flow) ---');

    // 1. Setup User in DB (Direct)
    try {
        await mongoose.connect(process.env.MONGODB_URI);
        let user = await User.findOne({ email: TEST_EMAIL });
        if (!user) {
            console.log('Creating test user...');
            // Need bcrypt? Or just let the register endpoint handle it?
            // Let's use the Register endpoint to be safe about hashing.
        } else {
            console.log('Test user exists.');
        }
    } catch (e) {
        console.error('DB Setup Error:', e);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }

    // 2. Login (via API) to get Token
    let token;
    try {
        console.log('Attempting valid login...');
        // Try login
        let res = await axios.post(`${API_URL}/auth/login`, {
            email: TEST_EMAIL,
            password: TEST_PASSWORD
        }, { validateStatus: () => true });

        // If not found/wrong pass, try register
        if (res.status !== 200) {
            console.log('Login failed (' + res.status + '), trying register...');
            res = await axios.post(`${API_URL}/auth/register`, {
                fullName: 'Debug Tester',
                email: TEST_EMAIL,
                password: TEST_PASSWORD
            }, { validateStatus: () => true });

            if (res.status === 201 || res.status === 200) {
                console.log('Register success. Logging in again...');
                res = await axios.post(`${API_URL}/auth/login`, {
                    email: TEST_EMAIL,
                    password: TEST_PASSWORD
                });
            } else {
                throw new Error(`Register failed: ${res.status} ${JSON.stringify(res.data)}`);
            }
        }

        if (res.data && res.data.token) {
            token = res.data.token;
            console.log('Login Success. Token acquired.');
        } else {
            throw new Error('No token in login response: ' + JSON.stringify(res.data));
        }

    } catch (e) {
        console.error('Auth Flow Failed:', e.message);
        if (e.response) console.error('Response:', e.response.data);
        process.exit(1);
    }

    // 3. Test startChat (via API)
    try {
        console.log('\n--- Testing POST /chatbot/start ---');
        const res = await axios.post(`${API_URL}/chatbot/start`, {}, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true // Don't throw on error
        });

        console.log(`Status: ${res.status}`);
        console.log('Response:', JSON.stringify(res.data, null, 2));

        if (res.status === 200) {
            console.log('SUCCESS: Chatbot /start is working.');
        } else {
            console.log('FAILURE: Chatbot /start failed.');
        }

    } catch (e) {
        console.error('API Call Failed:', e.message);
    }

    // 4. Test sendMessage (via API)
    try {
        console.log('\n--- Testing POST /chatbot/message ---');
        const res = await axios.post(`${API_URL}/chatbot/message`, {
            message: 'Hello, I am testing the API.'
        }, {
            headers: { Authorization: `Bearer ${token}` },
            validateStatus: () => true
        });

        console.log(`Status: ${res.status}`);
        // console.log('Response:', JSON.stringify(res.data, null, 2));

        if (res.status === 200 && res.data.response) {
            console.log('SUCCESS: Chatbot /message is working.');
            console.log('AI Response:', res.data.response);
        } else {
            console.log('FAILURE: Chatbot /message failed.');
            console.log('Error:', res.data);
        }

    } catch (e) {
        console.error('Message API Call Failed:', e.message);
    }
}

run();
