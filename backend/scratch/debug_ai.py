import os
from dotenv import load_dotenv
load_dotenv()

openai_key = os.getenv("OPENAI_API_KEY", "")
google_key = os.getenv("GOOGLE_API_KEY", "")
groq_key = os.getenv("GROQ_API_KEY", "")

print(f"DEBUG: OPENAI_API_KEY={openai_key}")
print(f"DEBUG: GOOGLE_API_KEY={google_key}")
print(f"DEBUG: GROQ_API_KEY={groq_key}")

if groq_key and not "YOUR_KEY_HERE" in groq_key:
    print("SELECTED: groq")
elif openai_key and not "YOUR_KEY_HERE" in openai_key:
    print("SELECTED: openai")
elif google_key and not "YOUR_KEY_HERE" in google_key:
    print("SELECTED: google")
else:
    print("SELECTED: mock")
