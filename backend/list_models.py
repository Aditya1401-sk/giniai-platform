import google.generativeai as genai
genai.configure(api_key="AIzaSyDRIn9TmiZ18uIaO0eUVvV1hciZ8cHqCI8")
for m in genai.list_models():
  if 'generateContent' in m.supported_generation_methods:
    print(m.name)
