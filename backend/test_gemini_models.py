import os
import sys
from dotenv import load_dotenv
from langchain_google_genai import ChatGoogleGenerativeAI

load_dotenv()

def test_gemini():
    api_key = os.getenv("GOOGLE_API_KEY")
    if not api_key:
        print("FAILED: GOOGLE_API_KEY not found in .env")
        return

    print(f"Testing Gemini with key: {api_key[:10]}...")
    
    # Pake nama model yang persis sukses di curl lu
    models_to_try = ["gemini-flash-latest", "gemini-1.5-flash"]
    
    for model_name in models_to_try:
        print(f"\n--- Trying model: {model_name} ---")
        try:
            llm = ChatGoogleGenerativeAI(model=model_name, google_api_key=api_key)
            res = llm.invoke("Say 'Connection Successful' if you can read this.")
            print(f"SUCCESS ({model_name}): {res.content}")
            return
        except Exception as e:
            print(f"FAILED ({model_name}): {str(e)[:200]}")

if __name__ == "__main__":
    test_gemini()
