
import { GoogleGenerativeAI } from '@google/generative-ai';
import 'dotenv/config';

async function testGemini() {
    console.log('Testing Gemini API with gemini-2.5-flash...');
    const apiKey = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(apiKey);

    try {
        const model = genAI.getGenerativeModel({ model: 'gemini-2.5-flash' });
        const result = await model.generateContent('Hello from 2.5 flash?');
        console.log('Response:', result.response.text());
        console.log('SUCCESS: gemini-2.5-flash works.');
    } catch (e) {
        console.log('FAILED:', e.message);
    }
}

testGemini();
