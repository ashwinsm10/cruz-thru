import os
import librosa
import io
import soundfile as sf
import time  
from concurrent.futures import ThreadPoolExecutor
from faster_whisper import WhisperModel

def transcribe_chunk_in_memory(audio_chunk, sr, model):
    with io.BytesIO() as f:
        sf.write(f, audio_chunk, sr, format='WAV')
        f.seek(0)
        segments, _ = model.transcribe(f, beam_size=1)
        return " ".join([segment.text for segment in segments])

def transcribe_audio(audio_file):
    audio_file_path = "/tmp/temp_audio.wav"
    audio_file.save(audio_file_path)

    start_time = time.time()

    audio, sr = librosa.load(audio_file_path, sr=None)
    
    chunk_duration = 60  
    chunk_length = int(chunk_duration * sr)
    audio_chunks = [audio[i:i + chunk_length] for i in range(0, len(audio), chunk_length)]

    model = WhisperModel("tiny", device="cpu", compute_type="int8")

    with ThreadPoolExecutor(max_workers=8) as executor:
        transcriptions = list(executor.map(lambda chunk: transcribe_chunk_in_memory(chunk, sr, model), audio_chunks))

    transcription = " ".join(transcriptions)

    os.remove(audio_file_path)

    total_time = time.time() - start_time

    total_audio_duration = len(audio) / sr / 60  

    avg_time_per_minute = total_time / total_audio_duration

    print(f"Total transcription time: {total_time:.2f} seconds")
    print(f"Total audio duration: {total_audio_duration:.2f} minutes")
    print(f"Average time to transcribe 1 minute of audio: {avg_time_per_minute:.2f} seconds")

    return transcription