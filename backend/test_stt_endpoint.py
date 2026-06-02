import requests

def test_stt():
    url = "http://127.0.0.1:8000/api/voice/stt"
    print(f"Testing POST {url}...")
    try:
        # Send an empty or small dummy wav content
        dummy_wav = b"RIFF\x24\x00\x00\x00WAVEfmt \x10\x00\x00\x00\x01\x00\x01\x00\x80\x3e\x00\x00\x00\x7d\x00\x00\x02\x00\x10\x00data\x00\x00\x00\x00"
        files = {"file": ("test.wav", dummy_wav, "audio/wav")}
        r = requests.post(url, files=files)
        print("Status Code:", r.status_code)
        print("Response JSON:", r.json() if r.headers.get("content-type") == "application/json" else r.text)
    except Exception as e:
        print("Error connecting:", e)

if __name__ == "__main__":
    test_stt()
