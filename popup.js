// popup.js
const toggleButton = document.getElementById("toggleButton");
let isRunning = false;
let capturedStream = null;
let audioContext = null;
let socket = null;
let processor = null;

toggleButton.addEventListener("click", () => {
  if (!isRunning) {

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, { action: "showHelperWindow" });
      }
    });

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

        // Clone the stream and play it locally if needed
        const clonedStream = capturedStream.clone();
        const audioElement = new Audio();
        audioElement.srcObject = clonedStream;
        audioElement.play().catch((error) => {
          console.error("Audio playback failed:", error);
          document.getElementById("status").textContent = "Audio playback error.";
        });

        // Set up WebSocket connection to Deepgram
        socket = new WebSocket("wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=48000", [
          "token",
          "96f534b1e5c65acaebbe1f1e0e8b76e9176961c7", // Replace with your Deepgram API key
        ]);

        socket.onopen = () => {
          // Set up Web Audio API for real-time processing
          audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(systemStream);

          // Create a script processor node to process audio in real-time
          // Note: ScriptProcessorNode is deprecated but still widely supported
          // Consider using AudioWorklet for production code
          processor = audioContext.createScriptProcessor(4096, 1, 1);

          processor.onaudioprocess = (e) => {
            if (socket.readyState === WebSocket.OPEN) {
              // Get the raw audio data
              const inputData = e.inputBuffer.getChannelData(0);

              // Convert to 16-bit PCM (Int16Array)
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                // Convert float32 to int16
                pcmData[i] = Math.min(1, Math.max(-1, inputData[i])) * 32767;
              }

              // Send the raw PCM data to Deepgram
              socket.send(pcmData.buffer);
            }
          };

          // Connect the nodes
          source.connect(processor);
          processor.connect(audioContext.destination);

          document.getElementById("status").textContent = "Listening...";
          toggleButton.textContent = "Stop Assistant";
          isRunning = true;
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
      }
    );
  } else {
    // Clean up and stop streaming
    if (processor) {
      processor.disconnect();
      processor = null;
    }

    if (audioContext) {
      audioContext.close();
      audioContext = null;
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