// popup.js
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
        async function (systemStream) {
            if (chrome.runtime.lastError) {
                console.error("System capture failed:", chrome.runtime.lastError);
                return;
            }

            capturedStream = systemStream;

            // Only play the system audio (other person's voice)
            const audioContext = new AudioContext();
            const source = audioContext.createMediaStreamSource(systemStream);
            const destination = audioContext.destination;
            source.connect(destination);

            chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
                if (tabs.length === 0) return;

                chrome.scripting.executeScript({
                    target: { tabId: tabs[0].id },
                    function: injectStream,
                    args: [systemStream.id],
                });
            });

            document.getElementById("start").style.display = "none";
            document.getElementById("stop").style.display = "block";
            document.getElementById("status").textContent = "listening to both parties...";
        }
    );
}

function injectStream(streamId) {
    navigator.mediaDevices.getUserMedia({
        audio: {
            deviceId: streamId,
            echoCancellation: true,
            noiseSuppression: true
        }
    })
        .then((stream) => {
            window.postMessage({
                action: "start_transcription",
                streamId: stream.id
            }, "*");
        })
        .catch((error) => {
            console.error("Failed to access captured audio:", error);
        });
}

