import google.generativeai as genai
import os
from dotenv import load_dotenv

# VERSION 2.0 - DIRECT GEMINI INTEGRATION
print("Initializing GiniAI Service v2.0 (Direct Gemini)")

load_dotenv()

GEMINI_API_KEY = os.getenv("GEMINI_API_KEY")
genai.configure(api_key=GEMINI_API_KEY)

def get_ai_response_stream(prompt: str):
    print(f"Generating stream for prompt: {prompt[:50]}...")
    model = genai.GenerativeModel('gemini-1.5-flash')
    
    try:
        response = model.generate_content(prompt, stream=True)
        for chunk in response:
            if chunk.text:
                yield chunk.text
    except Exception as e:
        print(f"GEMINI ERROR: {str(e)}")
        yield f"AI Service Error: {str(e)}"