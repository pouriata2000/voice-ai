// VoiceApp.js
import React, { useState, useEffect } from 'react';

function VoiceApp() {
    const [text, setText] = useState('');
    const [status, setStatus] = useState('Click "Capture Voice" to start.');
    const [aiResponse, setAiResponse] = useState(''); // For displaying the AI's response

    // Function to capture voice and automatically generate AI voice
    const captureVoice = async () => {
        setStatus('Listening...');
        try {
            const response = await fetch('http://127.0.0.1:5000/capture_voice', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                }
            });
            const data = await response.json();
            if (data.status === 'success') {
                setText(data.text);
                setStatus('Voice recognized. Generating AI response...');
            } else {
                setText(data.text);
                setStatus('Recognition failed.');
            }
        } catch (error) {
            setStatus('Service unavailable.');
            console.error('Error:', error);
        }
    };

    // Function to send text to the AI model and play the generated AI voice
    const generateVoiceFromAI = async () => {
        if (text) {
            try {
                const response = await fetch('http://127.0.0.1:5000/generate_response_voice', {
                    method: 'POST',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({ text })
                });
                const data = await response.json();
                if (data.audio_file) {
                    // Set the AI response text
                    setAiResponse(data.response_text);

                    // Play the AI-generated voice
                    const audio = new Audio(`http://127.0.0.1:5000/${data.audio_file}`);
                    audio.play();
                    setStatus('Playback complete.');
                }
            } catch (error) {
                setStatus('Error generating voice.');
                console.error('Error:', error);
            }
        } else {
            setStatus('No text to convert to voice.');
        }
    };

    // Automatically call generateVoiceFromAI when text is set
    useEffect(() => {
        if (text) {
            generateVoiceFromAI();
        }
    }, [text]); // The effect runs whenever `text` is updated

    return (
        <div style={{ textAlign: 'center', marginTop: '50px' }}>
            <h2>Voice Recognition and AI Voice Playback</h2>
            <p>{status}</p>
            <input
                type="text"
                value={text}
                readOnly
                style={{ width: '300px', padding: '10px', fontSize: '16px' }}
            />
            <p><strong>AI Response:</strong> {aiResponse}</p>
            <div style={{ marginTop: '20px' }}>
                <button onClick={captureVoice} style={{ padding: '10px 20px' }}>
                    Capture Voice
                </button>
            </div>
        </div>
    );
}

export default VoiceApp;

