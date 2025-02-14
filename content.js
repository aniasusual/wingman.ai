
// function displayTranscript(text) {

//     console.log(text);

//     console.log("reaches here");
//     let transcriptDiv = document.getElementById("transcription");
//     if (!transcriptDiv) {
//         transcriptDiv = document.createElement("div");
//         transcriptDiv.id = "transcription";
//         transcriptDiv.style.position = "fixed";
//         transcriptDiv.style.bottom = "10px";
//         transcriptDiv.style.left = "10px";
//         transcriptDiv.style.backgroundColor = "rgba(0,0,0,0.8)";
//         transcriptDiv.style.color = "white";
//         transcriptDiv.style.padding = "10px";
//         transcriptDiv.style.borderRadius = "5px";
//         transcriptDiv.style.zIndex = "9999";
//         document.body.appendChild(transcriptDiv);
//     }
//     transcriptDiv.innerText = text;
// }

// function stopTranscription() {
//     if (window.recorder) {
//         window.recorder.stop();
//         window.recorder = null;
//         console.log("Transcription stopped.");
//     }
// }


// window.addEventListener("message", (event) => {
//     if (event.data.action === "start_transcription") {
//         navigator.mediaDevices.getUserMedia({ audio: { deviceId: event.data.streamId } })
//             .then(startTranscription)
//             .catch(console.error);
//     }
// });

// async function transcribeAudio(audioBlob) {
//     console.log("Sending audio for transcription...");

//     // Convert the audio blob to a File object
//     const formData = new FormData();
//     formData.append("file", audioBlob, "audio.wav");
//     formData.append("model", "whisper-1"); // Whisper API model

//     try {
//         const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
//             method: "POST",
//             headers: {
//                 "Authorization": "Bearer YOUR_OPENAI_API_KEY", // Replace with your OpenAI API key
//             },
//             body: formData,
//         });

//         if (!response.ok) {
//             throw new Error(`API Error: ${response.statusText}`);
//         }

//         const data = await response.json();
//         console.log("Transcription received:", data.text);

//         // Display the transcription
//         displayTranscript(data.text);
//     } catch (error) {
//         console.error("Error transcribing audio:", error);
//     }
// }


// function startTranscription(stream) {
//     console.log("Starting transcription...");
//     const audioContext = new AudioContext();
//     const source = audioContext.createMediaStreamSource(stream);
//     source.connect(audioContext.destination); // Keep audio playing

//     const recordingDestination = audioContext.createMediaStreamDestination();
//     source.connect(recordingDestination);

//     const recorder = new MediaRecorder(recordingDestination.stream);
//     window.recorder = recorder; // Store globally to stop later

//     let audioChunks = [];

//     recorder.ondataavailable = (event) => {
//         audioChunks.push(event.data);
//     };

//     recorder.onstop = async () => {
//         const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
//         audioChunks = [];
//         transcribeAudio(audioBlob);
//         recorder.start();
//         setTimeout(() => recorder.stop(), 5000);
//     };

//     recorder.start();
//     setTimeout(() => recorder.stop(), 5000);
// }


async function loadVosk() {
    console.log("Loading Vosk...");
    const vosk = await import(chrome.runtime.getURL("vosk/vosk.js"));
    await vosk.init();
    const model = await vosk.createModel(chrome.runtime.getURL("vosk/voskModel"));
    return model;
}

async function startTranscription(stream) {
    console.log("Starting Vosk transcription...");

    const model = await loadVosk();
    const recognizer = new model.KaldiRecognizer(16000);

    const audioContext = new AudioContext();
    await audioContext.audioWorklet.addModule(chrome.runtime.getURL("audio/voskProcessor.js"));

    const source = audioContext.createMediaStreamSource(stream);
    const workletNode = new AudioWorkletNode(audioContext, "vosk-processor");

    workletNode.port.postMessage({ action: "loadModel", modelData: recognizer });

    workletNode.port.onmessage = (event) => {
        if (event.data.transcript) {
            displayTranscript(event.data.transcript);
        }
    };

    source.connect(workletNode);
    workletNode.connect(audioContext.destination);

    window.transcriptionNode = workletNode;
}

function stopTranscription() {
    if (window.transcriptionNode) {
        window.transcriptionNode.port.postMessage({ action: "stop" });
        window.transcriptionNode.disconnect();
        window.transcriptionNode = null;
        console.log("Vosk transcription stopped.");
    }
}

function displayTranscript(text) {
    console.log("Transcription:", text);
    let transcriptDiv = document.getElementById("transcription");
    if (!transcriptDiv) {
        transcriptDiv = document.createElement("div");
        transcriptDiv.id = "transcription";
        transcriptDiv.style.position = "fixed";
        transcriptDiv.style.bottom = "10px";
        transcriptDiv.style.left = "10px";
        transcriptDiv.style.backgroundColor = "rgba(0,0,0,0.8)";
        transcriptDiv.style.color = "white";
        transcriptDiv.style.padding = "10px";
        transcriptDiv.style.borderRadius = "5px";
        transcriptDiv.style.zIndex = "9999";
        document.body.appendChild(transcriptDiv);
    }
    transcriptDiv.innerText = text;
}

window.addEventListener("message", (event) => {
    if (event.data.action === "start_transcription") {
        navigator.mediaDevices.getUserMedia({ audio: { deviceId: event.data.streamId } })
            .then(startTranscription)
            .catch(console.error);
    }
});
