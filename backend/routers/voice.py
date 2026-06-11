from fastapi import APIRouter, File, UploadFile, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from google.cloud import speech
from google.cloud import texttospeech
import io

router = APIRouter()

# Initialize Google Cloud Speech and TTS clients
try:
    speech_client = speech.SpeechClient()
    tts_client = texttospeech.TextToSpeechClient()
except Exception as e:
    print(f"Warning: Could not initialize Google Cloud Speech/TTS clients: {e}")
    speech_client = None
    tts_client = None

class TTSRequest(BaseModel):
    text: str
    language: str = "en-IN"

@router.post("/stt")
async def speech_to_text(file: UploadFile = File(...), language: str = "en-IN"):
    if not speech_client:
        raise HTTPException(
            status_code=500,
            detail="Google Cloud Speech client not initialized. Ensure GCP ADC is configured."
        )
        
    try:
        content = await file.read()
        print(f"[Backend STT] Received file: {file.filename}, Content-Type: {file.content_type}, Size: {len(content)} bytes, Language: {language}")
        
        # Determine encoding based on file type
        # Chrome/Firefox MediaRecorder outputs WebM/Opus by default
        encoding = speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
        
        filename = file.filename.lower() if file.filename else ""
        if filename.endswith(".wav"):
            encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
        elif filename.endswith(".mp3"):
            encoding = speech.RecognitionConfig.AudioEncoding.MP3
        elif filename.endswith(".ogg"):
            encoding = speech.RecognitionConfig.AudioEncoding.OGG_OPUS
            
        config = speech.RecognitionConfig(
            encoding=encoding,
            language_code=language,
            # Accept both Hindi and English so Hinglish works too
            alternative_language_codes=["hi-IN", "en-IN"] if language in ["en-IN", "hi-IN"] else [],
            enable_automatic_punctuation=True,
            # NOTE: Do NOT set sample_rate_hertz for WEBM_OPUS — the synchronous
            # recognize API auto-detects the correct rate from the WebM container header.
            # Setting it explicitly causes a mismatch and empty transcripts.
            model="latest_short",  # Best model for short voice queries (<1 min)
        )
        
        audio = speech.RecognitionAudio(content=content)
        
        # Use the synchronous recognize API (NOT streaming_recognize).
        # streaming_recognize is for live microphone streams — sending a complete
        # pre-recorded blob as a single chunk makes Google return empty transcripts.
        # The synchronous API is designed exactly for this: full pre-recorded audio files.
        response = speech_client.recognize(config=config, audio=audio)
        
        transcript = ""
        for result in response.results:
            transcript += result.alternatives[0].transcript + " "
        
        transcript = transcript.strip()
        print(f"[Backend STT] Transcript: \"{transcript}\" ({len(response.results)} result(s))")
        return {"transcript": transcript}
        
    except Exception as e:
        print(f"[Backend STT] Error: {e}")
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/tts")
async def text_to_speech(request: TTSRequest):
    if not tts_client:
        raise HTTPException(
            status_code=500,
            detail="Google Cloud Text-to-Speech client not initialized. Ensure GCP ADC is configured."
        )
        
    try:
        lang_code = request.language
        
        # Select premium Indian accent voices (Neural2 is high-quality and fast)
        if lang_code == "hi-IN":
            voice_name = "hi-IN-Neural2-C"
        else:
            lang_code = "en-IN"
            voice_name = "en-IN-Neural2-B" # Highly natural Indian English voice
            
        synthesis_input = texttospeech.SynthesisInput(text=request.text)
        
        voice = texttospeech.VoiceSelectionParams(
            language_code=lang_code,
            name=voice_name
        )
        
        # Audio configuration
        audio_config = texttospeech.AudioConfig(
            audio_encoding=texttospeech.AudioEncoding.MP3,
            speaking_rate=1.05  # Slightly elevated rate for responsive conversation flow
        )
        
        response = tts_client.synthesize_speech(
            input=synthesis_input,
            voice=voice,
            audio_config=audio_config
        )
        
        return StreamingResponse(
            io.BytesIO(response.audio_content),
            media_type="audio/mpeg"
        )
        
    except Exception as e:
        print(f"Error in backend TTS: {e}")
        raise HTTPException(status_code=500, detail=str(e))
