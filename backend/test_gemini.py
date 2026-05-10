import google.generativeai as genai
import os

genai.configure(api_key="AIzaSyDRIn9TmiZ18uIaO0eUVvV1hciZ8cHqCI8")
model = genai.GenerativeModel('gemini-pro')
try:
    response = model.generate_content("Say hello")
    print(f"SUCCESS: {response.text}")
except Exception as e:
    print(f"FAILED: {str(e)}")
