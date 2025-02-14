let capturedStream = null;

document.getElementById("start").addEventListener("click", () => {
    startCapture();
});

document.getElementById("stop").addEventListener("click", () => {
    stopCapture();
});

function stopCapture() {
    if (capturedStream) {
        capturedStream.getTracks().forEach((track) => track.stop());
        capturedStream = null;
    }

    // Inject and execute stopTranscription inside content.js
    chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
        if (tabs.length === 0) return;

        chrome.scripting.executeScript({
            target: { tabId: tabs[0].id },
            func: () => {
                if (window.recorder) {
                    window.recorder.stop();
                    console.log("Transcription stopped.");
                }
            },
        });
    });

    // Update UI
    document.getElementById("start").style.display = "block";
    document.getElementById("stop").style.display = "none";
    document.getElementById("status").textContent = "ready to go!";
    document.getElementById("transcription").textContent = "";
}


function startCapture() {
    if (!chrome.tabCapture) {
        console.error("tabCapture API not available in this context.");
        return;
    }

    chrome.tabCapture.capture(
        {
            audio: true,
            video: false,
            audioConstraints: { mandatory: { echoCancellation: true } },
        },
        function (stream) {
            if (chrome.runtime.lastError) {
                console.error("Capture failed:", chrome.runtime.lastError);
                return;
            }

            if (!stream) {
                console.error("No stream received.");
                return;
            }

            console.log("Captured audio stream successfully.");
            capturedStream = stream; // Store stream

            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(stream);
            const destination = audioContext.destination;
            source.connect(destination); // Connect the audio to speakers

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length === 0) return;

                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: injectStream,
                    args: [stream.id],
                });
            });

            document.getElementById("start").style.display = "none";
            document.getElementById("stop").style.display = "block";
            document.getElementById("status").textContent = "listening...";
        }
    );
}


// Inject stream into the content script
function injectStream(streamId) {
    navigator.mediaDevices.getUserMedia({ audio: { deviceId: streamId } })
        .then((stream) => {
            window.postMessage({ action: "start_transcription", streamId: stream.id }, "*");
        })
        .catch((error) => {
            console.error("Failed to access captured audio:", error);
        });
}
