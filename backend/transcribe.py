import os
import librosa
import whisper

def transcribe_audio(audio_file):
    # Step 1: Save the uploaded file to a temporary path
    audio_file_path = "/tmp/temp_audio.wav"  # Use a temporary file path
    audio_file.save(audio_file_path)

    # Step 2: Load the saved audio file using librosa
    audio, sr = librosa.load(audio_file_path, sr=16000)

    # Check if audio was loaded correctly
    print(f"Audio loaded: {audio.shape}, Sample rate: {sr}")

    # Step 3: Initialize the Whisper model
    model = whisper.load_model("base")

    # Step 4: Pass the file path to Whisper's transcribe method
    result = model.transcribe(audio_file_path)

    # Step 5: Optionally clean up the temporary file
    os.remove(audio_file_path)

    return result
