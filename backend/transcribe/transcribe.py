import whisper

def transcribe_audio(audio_file_path, model_size="base"):
    
    # Load Whisper model
    print(f"Loading Whisper model '{model_size}'...")
    model = whisper.load_model(model_size)
    
    # Transcribe the audio file
    print(f"Transcribing {audio_file_path}...")
    result = model.transcribe(audio_file_path)
    
    return result['text']