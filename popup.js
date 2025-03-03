// popup.js
const toggleButton = document.getElementById("toggleButton");
let isRunning = false;
let capturedStream = null;
let mediaRecorder = null;
let socket = null;

toggleButton.addEventListener("click", () => {
  if (!isRunning) {
    if (!chrome.tabCapture) {
      console.error("tabCapture API not available.");
      document.getElementById("status").textContent = "Tab capture not available.";
      return;
    }

    chrome.tabCapture.capture(
      {
        audio: true,
        video: false,
        audioConstraints: { mandatory: { echoCancellation: true } },
      },
      (systemStream) => {
        if (chrome.runtime.lastError) {
          console.error("System capture failed:", chrome.runtime.lastError);
          document.getElementById("status").textContent = "Failed to capture audio.";
          return;
        }

        capturedStream = systemStream;

        // Clone the stream and play it locally
        clonedStream = capturedStream.clone(); // Clone the stream for playback
        audioElement = new Audio();
        audioElement.srcObject = clonedStream; // Attach cloned stream to audio element
        audioElement.play().catch((error) => {
          console.error("Audio playback failed:", error);
          document.getElementById("status").textContent = "Audio playback error.";
        });


        mediaRecorder = new MediaRecorder(systemStream, { mimeType: "audio/webm" });
        socket = new WebSocket("wss://api.deepgram.com/v1/listen", [
          "token",
          "96f534b1e5c65acaebbe1f1e0e8b76e9176961c7", // Replace with your Deepgram API key
        ]);

        socket.onopen = () => {
          mediaRecorder.start(250);
          document.getElementById("status").textContent = "Listening...";
          toggleButton.textContent = "Stop Assistant";
          isRunning = true;
          // chrome.action.setPopup({ popup: "popup.html" });
        };

        socket.onmessage = (message) => {
          const data = JSON.parse(message.data);
          const transcript = data.channel?.alternatives[0]?.transcript || "";
          if (transcript) {
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: "displayTranscript",
                  transcript: transcript,
                });
              }
            });
          }
        };

        socket.onclose = () => {
          console.log("WebSocket closed.");
        };

        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          document.getElementById("status").textContent = "Transcription error.";
        };

        mediaRecorder.ondataavailable = (event) => {
          if (socket.readyState === WebSocket.OPEN && event.data.size > 0) {
            socket.send(event.data);
          }
        };

        mediaRecorder.onstop = () => {
          if (capturedStream) {
            capturedStream.getTracks().forEach((track) => track.stop());
          }
          if (socket) {
            socket.close();
          }
        };
      }
    );
  } else {
    if (mediaRecorder && mediaRecorder.state !== "inactive") {
      mediaRecorder.stop();
    }
    if (socket) {
      socket.close();
      socket = null;
    }
    if (capturedStream) {
      capturedStream.getTracks().forEach((track) => track.stop());
      capturedStream = null;
    }
    document.getElementById("status").textContent = "Stopped.";
    toggleButton.textContent = "Start Assistant";
    isRunning = false;
  }
});

document.getElementById("notesUpload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const reader = new FileReader();
    reader.onload = (e) => {
      chrome.runtime.sendMessage(
        { action: "uploadNotes", notes: e.target.result },
        (response) => {
          alert(response.status);
        }
      );
    };
    reader.readAsText(file);
  }
});

document.getElementById("generatePresentation").addEventListener("click", () => {
  chrome.runtime.sendMessage({ action: "getPresentation" });
});