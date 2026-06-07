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
        
        # Determine standard encoding and sample rate
        # Chrome/Firefox MediaRecorder output is typically WebM/Opus.
        encoding = speech.RecognitionConfig.AudioEncoding.WEBM_OPUS
        sample_rate = 48000
        
        filename = file.filename.lower() if file.filename else ""
        if filename.endswith(".wav"):
            encoding = speech.RecognitionConfig.AudioEncoding.LINEAR16
            sample_rate = 16000
        elif filename.endswith(".mp3"):
            encoding = speech.RecognitionConfig.AudioEncoding.MP3
            sample_rate = 16000
            
        config_kwargs = {
            "encoding": encoding,
            "language_code": language,
            "alternative_language_codes": ["hi-IN", "en-IN"] if language in ["en-IN", "hi-IN"] else [],
            "enable_automatic_punctuation": True
        }
        
        # NOTE: The streaming_recognize API CANNOT auto-detect Opus sample rate from
        # WebM container headers (unlike the synchronous recognize API).
        # We must always provide sample_rate_hertz explicitly for streaming.
        # Chrome/Firefox MediaRecorder always encodes Opus at 48000 Hz.
        config_kwargs["sample_rate_hertz"] = sample_rate
            
        config = speech.RecognitionConfig(**config_kwargs)
        
        # Use StreamingRecognize to bypass Chrome's missing WebM duration header bug
        # which causes the synchronous recognize() to return empty results.
        streaming_config = speech.StreamingRecognitionConfig(
            config=config,
            single_utterance=False
        )
        
        # We can send the entire content in a single chunk
        requests = [speech.StreamingRecognizeRequest(audio_content=content)]
        
        responses = speech_client.streaming_recognize(
            config=streaming_config, 
            requests=requests
        )
        
        transcript = ""
        for response in responses:
            for result in response.results:
                transcript += result.alternatives[0].transcript + " "
                
        return {"transcript": transcript.strip()}
        
    except Exception as e:
        print(f"Error in backend STT: {e}")
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
