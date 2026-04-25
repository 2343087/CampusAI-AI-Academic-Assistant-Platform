import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_chat():
    payload = {
        "query": "Kapan deadline KRS ganjil dan berapa denda kalau telat?",
        "user_id": "1"
    }
    
    try:
        print(f"Sending query: '{payload['query']}'")
        response = requests.post(f"{BASE_URL}/chat/", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response:\n{json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_chat()
