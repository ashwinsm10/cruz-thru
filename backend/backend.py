from flask import Flask, request, jsonify
from transcribe import transcribe_audio
from notemake import generate_notes


app = Flask(__name__)
print(app)

# Route for transcription
@app.route('/transcribe', methods=['POST'])
def backend():
    # Get the uploaded audio file from the request
    if 'audio_file' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio_file']

    # Use Speech Recognition to transcribe the audio
    transcription = transcribe_audio(audio_file)

    # Summarize the transcription using the Gemini module
    lecture_notes = generate_notes(transcription)

    return jsonify({
        "transcription": transcription,
        "lecture_notes": lecture_notes
    })

# Run the Flask app
if __name__ == '__main__':
    app.run(debug=True)
