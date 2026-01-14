require('dotenv').config();

const API_KEY = process.env.GEMINI_API_KEY;

if (!API_KEY) {
    console.error("❌ GEMINI_API_KEY is missing in .env");
    process.exit(1);
}

console.log("Found API Key:", API_KEY.substring(0, 5) + "...");

async function testGemini() {
    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;
    
    console.log("Listing models from:", url);

    try {
        const response = await fetch(url);
        const data = await response.json();
        
        if (data.models) {
            console.log("✅ Available Models:");
            data.models.forEach(m => console.log(` - ${m.name}`));
        } else {
            console.log("❌ Error/No Models:", data);
        }

    } catch (err) {
        console.error("❌ System Error:", err);
    }
}

testGemini();
