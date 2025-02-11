
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

function startTranscription(stream) {
    console.log("lode k bache");
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);

    // 2. Keep audio playing through speakers
    source.connect(audioContext.destination);

    // 3. Create a MediaStream destination for recording
    const recordingDestination = audioContext.createMediaStreamDestination();
    source.connect(recordingDestination);

    // 4. Setup MediaRecorder
    const recorder = new MediaRecorder(recordingDestination.stream);
    let audioChunks = [];

    recorder.ondataavailable = (event) => {
        audioChunks.push(event.data);
    };

    recorder.onstop = async () => {
        const audioBlob = new Blob(audioChunks, { type: "audio/wav" });
        audioChunks = []; // Clear chunks to free memory
        transcribeAudio(audioBlob);

        // Restart recording if needed
        recorder.start();
        setTimeout(() => recorder.stop(), 5000); // Stop after 5s
    };

    chrome.runtime.sendMessage(
        { action: "test", message: "Hello from content.js!" },
        (response) => {
            if (chrome.runtime.lastError) {
                console.error("Error sending message:", chrome.runtime.lastError);
            } else {
                console.log("Response from background:", response);
            }
        }
    );

    recorder.start();
    setTimeout(() => recorder.stop(), 5000); // Stop after 5s
}



chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start_transcription") {
        console.log("Starting transcription...");
        startTranscription(message.stream);
    }
});
