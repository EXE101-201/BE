// List of bad words to filter (Vietnamese and English)
const badWords = [
    'fuck', 'shit', 'damn', 'bitch', 'asshole',
    'địt', 'đéo', 'chó', 'mẹ', 'con', 'lồn', 'cặc', 'buồi', 'đĩ', 'đụ', 'đâm', 'ăn', 'ăn cứt', 'ăn đĩ', 'ăn lồn',
    // Add more as needed
];

export const containsBadWords = (text) => {
    const lowerText = text.toLowerCase();
    return badWords.some(word => lowerText.includes(word));
};

export default { containsBadWords };