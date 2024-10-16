from flask import Flask, request, jsonify
from transcribe import transcribe_audio
from notemake import answer_question, generate_notes, generate_flashcards


app = Flask(__name__)

@app.route('/transcribe', methods=['POST'])
def backend():
    if 'audio_file' not in request.files:
        return jsonify({"error": "No audio file provided"}), 400
    
    audio_file = request.files['audio_file']

    transcription = transcribe_audio(audio_file)

    lecture_notes = generate_notes(transcription)

    flashcards = generate_flashcards(lecture_notes)

    return jsonify({
        "transcription": transcription,
        "lecture_notes": lecture_notes,
        "flashcards": flashcards
    })
@app.route('/ask', methods=['POST'])
def ask():
    data = request.get_json()

    if 'notes' not in data or 'question' not in data:
        return jsonify({"error": "Notes or question missing"}), 400

    notes = data['notes']
    question = data['question']

    answer = answer_question(notes, question)

    return jsonify({"answer": answer})


if __name__ == '__main__':
    app.run(debug=True, host='0.0.0.0', port=5001)