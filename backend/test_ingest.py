import requests
import json

BASE_URL = "http://localhost:8000/api"

def test_ingest():
    with open("../sample_data.txt", "r") as f:
        content = f.read()
    
    payload = {
        "text": content,
        "metadata": {"source": "manual_test", "type": "academic_rules"}
    }
    
    try:
        response = requests.post(f"{BASE_URL}/chat/ingest", json=payload)
        print(f"Status Code: {response.status_code}")
        print(f"Response: {json.dumps(response.json(), indent=2)}")
    except Exception as e:
        print(f"Error: {e}")

if __name__ == "__main__":
    test_ingest()
