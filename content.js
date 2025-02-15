let systemRecognition = null;
let micRecognition = null;
let systemTranscript = '';
let micTranscript = '';

window.addEventListener("message", (event) => {
    if (event.data.action === "start_transcription") {
        // Get microphone stream for local voice
        navigator.mediaDevices.getUserMedia({
            audio: {
                echoCancellation: true,
                noiseSuppression: true
            }
        })
            .then(micStream => {
                // Get system stream for remote voice
                navigator.mediaDevices.getUserMedia({
                    audio: {
                        deviceId: event.data.streamId
                    }
                })
                    .then(systemStream => {
                        startDualTranscription(systemStream, micStream);
                    });
            })
            .catch(console.error);
    }
});

function startDualTranscription(systemStream, micStream) {
    // Initialize two speech recognition instances
    systemRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    micRecognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();

    // Configure both recognition instances
    [systemRecognition, micRecognition].forEach(recognition => {
        recognition.continuous = true;
        recognition.interimResults = true;
        recognition.lang = 'en-US';
    });

    // Set up audio contexts and processing
    const systemContext = new AudioContext();
    const micContext = new AudioContext();

    const systemSource = systemContext.createMediaStreamSource(systemStream);
    const micSource = micContext.createMediaStreamSource(micStream);

    // Only connect system audio to speakers, not the mic audio
    systemSource.connect(systemContext.destination);
    // Don't connect micSource to destination to prevent echo
    // But we'll still use it for transcription

    // Create MediaStreamDestination for system audio
    const systemDestination = systemContext.createMediaStreamDestination();
    systemSource.connect(systemDestination);

    // Create MediaStreamDestination for mic audio (for transcription only)
    const micDestination = micContext.createMediaStreamDestination();
    micSource.connect(micDestination);

    // Handle system audio transcription (other person)
    systemRecognition.onresult = (event) => {
        handleTranscriptionResult(event, 'system');
    };

    // Handle microphone transcription (your voice)
    micRecognition.onresult = (event) => {
        handleTranscriptionResult(event, 'mic');
    };

    // Start both recognition instances
    try {
        systemRecognition.start();
        micRecognition.start();

        window.recorder = {
            stop: () => {
                systemRecognition.stop();
                micRecognition.stop();
                systemSource.disconnect();
                micSource.disconnect();
                systemContext.close();
                micContext.close();
                systemStream.getTracks().forEach(track => track.stop());
                micStream.getTracks().forEach(track => track.stop());
                systemRecognition = null;
                micRecognition = null;
                window.recorder = null;
                // Clear transcripts
                systemTranscript = '';
                micTranscript = '';
                // Remove transcript display
                const transcriptDiv = document.getElementById("transcription");
                if (transcriptDiv) {
                    transcriptDiv.remove();
                }
            }
        };
    } catch (error) {
        console.error('Failed to start recognition:', error);
    }
}

function handleTranscriptionResult(event, source) {
    let finalTranscript = '';
    let interimTranscript = '';

    for (let i = event.resultIndex; i < event.results.length; i++) {
        const transcript = event.results[i][0].transcript;
        if (event.results[i].isFinal) {
            finalTranscript += transcript + ' ';
            if (source === 'system') {
                systemTranscript += transcript + ' ';
            } else {
                micTranscript += transcript + ' ';
            }
        } else {
            interimTranscript += transcript;
        }
    }

    displayDualTranscript(systemTranscript, micTranscript, source, interimTranscript);
}

function displayDualTranscript(systemTranscript, micTranscript, currentSource, interimText) {
    console.log("systemTranscript: ", systemTranscript);
    console.log("micTranscript: ", micTranscript);
    console.log("currentSource: ", currentSource);

    let transcriptDiv = document.getElementById("transcription");
    if (!transcriptDiv) {
        transcriptDiv = document.createElement("div");
        transcriptDiv.id = "transcription";
        transcriptDiv.style.position = "fixed";
        transcriptDiv.style.bottom = "10px";
        transcriptDiv.style.left = "10px";
        transcriptDiv.style.width = "400px";
        transcriptDiv.style.maxHeight = "300px";
        transcriptDiv.style.overflowY = "auto";
        transcriptDiv.style.backgroundColor = "rgba(0,0,0,0.8)";
        transcriptDiv.style.color = "white";
        transcriptDiv.style.padding = "15px";
        transcriptDiv.style.borderRadius = "5px";
        transcriptDiv.style.zIndex = "9999";
        transcriptDiv.style.fontFamily = "Arial, sans-serif";
        transcriptDiv.style.fontSize = "14px";
        document.body.appendChild(transcriptDiv);
    }

    transcriptDiv.innerHTML = `
        <div style="margin-bottom: 10px;">
            <div style="color: #4CAF50; margin-bottom: 5px;">You:</div>
            <div style="margin-left: 10px;">${micTranscript}</div>
            ${currentSource === 'mic' ?
            `<div style="margin-left: 10px; color: #aaa; font-style: italic;">${interimText}</div>` :
            ''}
        </div>
        <div style="margin-bottom: 10px;">
            <div style="color: #2196F3; margin-bottom: 5px;">Other Person:</div>
            <div style="margin-left: 10px;">${systemTranscript}</div>
            ${currentSource === 'system' ?
            `<div style="margin-left: 10px; color: #aaa; font-style: italic;">${interimText}</div>` :
            ''}
        </div>
    `;
}