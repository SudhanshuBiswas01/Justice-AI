"""Test WebM STT streaming to diagnose voice issues."""
from google.cloud import speech

client = speech.SpeechClient()

# Minimal valid WebM/Opus header (what Chrome MediaRecorder sends)
tiny_webm = bytes([
    0x1a, 0x45, 0xdf, 0xa3,  # EBML Header ID
    0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x1f,
    0x42, 0x86, 0x81, 0x01,
    0x42, 0xf7, 0x81, 0x01,
    0x42, 0xf2, 0x81, 0x04,
    0x42, 0xf3, 0x81, 0x08,
    0x42, 0x82, 0x84, 0x77, 0x65, 0x62, 0x6d,
    0x42, 0x87, 0x81, 0x04,
    0x42, 0x85, 0x81, 0x02,
])

print(f"Testing with {len(tiny_webm)} bytes of WebM data...")

config = speech.RecognitionConfig(
    encoding=speech.RecognitionConfig.AudioEncoding.WEBM_OPUS,
    sample_rate_hertz=48000,
    language_code="en-IN",
    enable_automatic_punctuation=True
)
streaming_config = speech.StreamingRecognitionConfig(config=config, single_utterance=False)
requests_list = [speech.StreamingRecognizeRequest(audio_content=tiny_webm)]

try:
    responses = client.streaming_recognize(config=streaming_config, requests=requests_list)
    transcript = ""
    for response in responses:
        for result in response.results:
            transcript += result.alternatives[0].transcript
    print(f"STT OK: transcript='{transcript}' (empty is expected for silence/tiny audio)")
except Exception as e:
    print(f"STT Error: {type(e).__name__}: {e}")
