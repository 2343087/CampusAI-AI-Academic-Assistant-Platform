import os
from dotenv import load_dotenv
from langchain_groq import ChatGroq

load_dotenv()

def test_groq():
    api_key = os.getenv("GROQ_API_KEY")
    if not api_key:
        print("FAILED: GROQ_API_KEY not found in .env")
        return

    print(f"Testing Groq with key: {api_key[:10]}...")
    
    try:
        llm = ChatGroq(
            model="llama-3.3-70b-versatile",
            api_key=api_key,
            temperature=0.3
        )
        res = llm.invoke("Say 'Groq is Active' if you can read this.")
        print(f"SUCCESS: {res.content}")
    except Exception as e:
        print(f"FAILED: {str(e)}")

if __name__ == "__main__":
    test_groq()
