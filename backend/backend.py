from flask import Flask, request, jsonify
from transcribe import transcribe_audio
from notemake import generate_notes


app = Flask(__name__)
print(app)

@app.route('/transcribe', methods=['POST'])
def backend():
    if 'audio_file' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio_file']

    transcription = transcribe_audio(audio_file)

    lecture_notes = generate_notes(transcription)
    print(type(transcription))
    print(type(lecture_notes))

    return jsonify({
        "transcription": transcription,
        "lecture_notes": lecture_notes
    })

if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)
