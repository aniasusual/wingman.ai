let systemRecognition = null;
let micRecognition = null;
let systemTranscript = '';
let micTranscript = '';
let isSystemRecognitionActive = false;
let isMicRecognitionActive = false;
let shouldContinueRecognition = false;

window.addEventListener('message', async (event) => {
    if (event.data.type === 'STREAMS_READY') {
        const { systemStreamId, micStreamId } = event.data;
        console.log("systemStreamId:", systemStreamId);
        console.log("micStreamId:", micStreamId);

        try {
            const systemStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: systemStreamId,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            const micStream = await navigator.mediaDevices.getUserMedia({
                audio: {
                    deviceId: micStreamId,
                    echoCancellation: true,
                    noiseSuppression: true
                }
            });

            startDualTranscription(systemStream, micStream);
        } catch (error) {
            console.error('Error accessing streams:', error);
        }
    }
});

function initializeRecognition(type) {
    const recognition = new (window.SpeechRecognition || window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = 'en-US';

    recognition.onstart = () => {
        console.log(`${type} recognition started`);
        if (type === 'system') {
            isSystemRecognitionActive = true;
        } else {
            isMicRecognitionActive = true;
        }
    };

    recognition.onend = () => {
        console.log(`${type} recognition ended`);
        if (type === 'system') {
            isSystemRecognitionActive = false;
        } else {
            isMicRecognitionActive = false;
        }

        // Only restart if we should continue
        if (shouldContinueRecognition) {
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (e) {
                    console.error(`Error restarting ${type} recognition:`, e);
                }
            }, 1000);
        }
    };

    recognition.onerror = (event) => {
        console.error(`${type} recognition error:`, event.error);
        if (type === 'system') {
            isSystemRecognitionActive = false;
        } else {
            isMicRecognitionActive = false;
        }

        // Only restart on certain errors
        if (event.error === 'network' || event.error === 'aborted') {
            setTimeout(() => {
                try {
                    recognition.start();
                } catch (e) {
                    console.error(`Error restarting ${type} recognition after error:`, e);
                }
            }, 1000);
        }
    };

    recognition.onresult = (event) => {
        handleTranscriptionResult(event, type.toLowerCase());
    };

    return recognition;
}

async function startDualTranscription(systemStream, micStream) {
    console.log("Starting dual transcription");
    shouldContinueRecognition = true;

    // Set up audio contexts
    const systemContext = new AudioContext();
    const micContext = new AudioContext();

    const systemSource = systemContext.createMediaStreamSource(systemStream);
    const micSource = micContext.createMediaStreamSource(micStream);

    // Only play system audio through speakers
    systemSource.connect(systemContext.destination);

    // Initialize recognition instances
    systemRecognition = initializeRecognition('system');
    micRecognition = initializeRecognition('mic');

    // Start both recognitions
    try {
        if (!isSystemRecognitionActive) {
            await systemRecognition.start();
        }
        // Wait a bit before starting the second recognition
        setTimeout(async () => {
            if (!isMicRecognitionActive) {
                await micRecognition.start();
            }
        }, 500);

        window.recorder = {
            stop: () => {
                try {
                    shouldContinueRecognition = false;

                    if (systemRecognition) {
                        systemRecognition.stop();
                    }
                    if (micRecognition) {
                        micRecognition.stop();
                    }

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
                    isSystemRecognitionActive = false;
                    isMicRecognitionActive = false;

                    // Remove transcript display
                    const transcriptDiv = document.getElementById("transcription");
                    if (transcriptDiv) {
                        transcriptDiv.remove();
                    }
                } catch (error) {
                    console.error('Error stopping recording:', error);
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