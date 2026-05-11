import os
import requests
import json
from dotenv import load_dotenv

# VERSION 3.0 - STABLE OPENROUTER (FREE TIER)
print("Initializing GiniAI Service v3.0 (OpenRouter Free Tier)")

load_dotenv()

OPENROUTER_API_KEY = os.getenv("OPENROUTER_API_KEY")

def get_ai_response_stream(prompt: str):
    print(f"Generating stream via OpenRouter for: {prompt[:50]}...")
    
    url = "https://openrouter.ai/api/v1/chat/completions"
    headers = {
        "Authorization": f"Bearer {OPENROUTER_API_KEY}",
        "Content-Type": "application/json"
    }
    
    # Using openrouter/free to ensure stability
    payload = {
        "model": "openrouter/free", 
        "messages": [
            {
                "role": "system", 
                "content": "You are the GiniAI Assistant. Today's date is May 11, 2026. You represent GiniLytics IT Solutions (founded in 2020 by Noah Skocilich and Pralyankar Kumar Singh). GiniLytics is a premier software engineering firm with offices in Mohali, India and Plano, Texas. You specialize in AI-Powered Solutions, Custom Web/Mobile Development (MERN, .NET Core, PHP), and Strategic Business Consultation. You are aware of recent global trends up to 2026. Your goal is to assist users with technical queries and business insights while maintaining a professional, innovative, and helpful tone representing GiniLytics."
            },
            {"role": "user", "content": prompt}
        ],
        "stream": True
    }

    try:
        response = requests.post(url, headers=headers, data=json.dumps(payload), stream=True)
        response.raise_for_status()
        
        for line in response.iter_lines():
            if line:
                line_text = line.decode('utf-8')
                if line_text.startswith("data: "):
                    data_str = line_text[6:]
                    if data_str == "[DONE]":
                        break
                    try:
                        data = json.loads(data_str)
                        if "choices" in data and len(data["choices"]) > 0:
                            content = data["choices"][0].get("delta", {}).get("content", "")
                            if content:
                                yield content
                    except json.JSONDecodeError:
                        continue
                        
    except Exception as e:
        print(f"OPENROUTER ERROR: {str(e)}")
        yield f"AI Service Error: {str(e)}"