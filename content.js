// chrome.runtime.onMessage.addListener((message) => {
//     if (message.action === "display_transcript") {
//         displayTranscript(message.transcript);
//     }
// });

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

function startTranscription(stream) {
    const recognition = new (window.SpeechRecognition ||
        window.webkitSpeechRecognition)();
    recognition.continuous = true;
    recognition.interimResults = true;
    recognition.lang = "en-US";

    // Create an AudioContext to process the stream
    const audioContext = new AudioContext();
    const source = audioContext.createMediaStreamSource(stream);
    const destination = audioContext.createMediaStreamDestination();
    source.connect(destination);

    recognition.onresult = (event) => {
        let transcript = "";
        for (let i = event.resultIndex; i < event.results.length; i++) {
            transcript += event.results[i][0].transcript + " ";
        }
        console.log("Live Transcription:", transcript);
        displayTranscript(transcript);
    };

    recognition.onerror = (event) => {
        console.error("SpeechRecognition error:", event.error);
    };

    recognition.start();
}


chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "start_transcription") {
        console.log("Starting transcription...");
        startTranscription(message.stream);
    }
});