
function displayTranscript(text) {

    console.log(text);

    console.log("reaches here");
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

// function startTranscription(stream) {
//     const recognition = new (window.SpeechRecognition ||
//         window.webkitSpeechRecognition)();
//     recognition.continuous = true;
//     recognition.interimResults = true;
//     recognition.lang = "en-US";

//     // Create an AudioContext to process the stream
//     const audioContext = new AudioContext();

//     // const source = audioContext.createMediaStreamSource(stream);
//     // const destination = audioContext.createMediaStreamDestination();
//     // source.connect(destination);


//     const source = audioContext.createMediaStreamSource(stream);

//     // 4. Create a destination node to keep audio playing through speakers
//     const outputDestination = audioContext.destination;

//     // 5. Create a MediaStream destination to capture the audio separately
//     const recordingDestination = audioContext.createMediaStreamDestination();

//     // 6. Connect the source to both destinations
//     source.connect(outputDestination); // Keep audio playing
//     source.connect(recordingDestination);


//     recognition.onresult = (event) => {
//         let transcript = "";
//         for (let i = event.resultIndex; i < event.results.length; i++) {
//             transcript += event.results[i][0].transcript + " ";
//         }
//         console.log("Live Transcription:", transcript);
//         displayTranscript(transcript);
//     };

//     recognition.onerror = (event) => {
//         console.error("SpeechRecognition error:", event.error);
//     };

//     recognition.start();
// }

window.addEventListener("message", (event) => {
    if (event.data.action === "start_transcription") {
        navigator.mediaDevices.getUserMedia({ audio: { deviceId: event.data.streamId } })
            .then(startTranscription)
            .catch(console.error);
    }
});

function startTranscription(stream) {
    console.log("Starting transcription...");
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    source.connect(audioContext.destination); // Keep audio playing

    const recordingDestination = audioContext.createMediaStreamDestination();
    source.connect(recordingDestination);

    const recorder = new MediaRecorder(recordingDestination.stream);
    let audioChunks = [];

    recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        audioChunks = [];
        transcribeAudio(audioBlob);
        recorder.start();
        setTimeout(() => recorder.stop(), 5000);
    };

    recorder.start();
    setTimeout(() => recorder.stop(), 5000);
}




// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//     if (message.action === "start_transcription") {
//         console.log("Starting transcription...");
//         startTranscription(message.stream);
//     }
// });
