import os
from flask import Flask, request, jsonify, send_from_directory
from flask_cors import CORS
import speech_recognition as sr
from gtts import gTTS
from openai import OpenAI
from datetime import datetime

app = Flask(__name__)
CORS(app)

STATIC_FOLDER = "static"
os.makedirs(STATIC_FOLDER, exist_ok=True)

recognizer = sr.Recognizer()
client = OpenAI(api_key=os.getenv("OPENAI_API_KEY"))

@app.route('/capture_voice', methods=['POST'])
def capture_voice():
    with sr.Microphone() as source:
        try:
            audio = recognizer.listen(source)
            text = recognizer.recognize_google(audio)
            return jsonify({"text": text, "status": "success"})
        except sr.UnknownValueError:
            return jsonify({"text": "Could not understand audio", "status": "error"})
        except sr.RequestError:
            return jsonify({"text": "Speech recognition service is unavailable", "status": "error"})

@app.route('/generate_response_voice', methods=['POST'])
def generate_response_voice():
    data = request.json
    input_text = data.get("text", "")
    if input_text:
        try:
            chat_completion = client.chat.completions.create(
                messages=[{"role": "user", "content": input_text}],
                model="gpt-3.5-turbo",
            )
            ai_response = chat_completion.choices[0].message.content.strip()
        except Exception as e:
            print("Error with AI model:", e)
            return jsonify({"error": f"AI model error: {str(e)}"}), 500

        # Generate a unique filename for each response
        timestamp = datetime.now().strftime("%Y%m%d%H%M%S")
        audio_file_name = f"ai_response_{timestamp}.mp3"
        audio_file_path = os.path.join(STATIC_FOLDER, audio_file_name)
        
        # Generate and save the TTS audio file
        tts = gTTS(text=ai_response, lang='en')
        tts.save(audio_file_path)

        return jsonify({"audio_file": f"static/{audio_file_name}", "response_text": ai_response})
    else:
        return jsonify({"error": "No text provided"}), 400

@app.route('/static/<path:filename>')
def serve_static(filename):
    return send_from_directory(STATIC_FOLDER, filename)

if __name__ == '__main__':
    app.run(debug=True)
