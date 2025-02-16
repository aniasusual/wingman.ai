console.log("Content script loaded and listening for messages");

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  console.log("Received message in content.js:", message);

  if (message.action === "startProcessing") {
    console.log("Starting processing with stream ID:", message.streamId);

    navigator.mediaDevices
      .getUserMedia({
        audio: {
          mandatory: {
            chromeMediaSource: "tab",
            chromeMediaSourceId: message.streamId,
          },
        },
      })
      .then((stream) => {
        console.log("Got stream from tab capture");
        startDeepgramStream(stream);
        sendResponse({ status: "started" });
      })
      .catch((error) => {
        console.error("Error accessing media stream:", error);
        sendResponse({ error: error.message });
      });
  } else if (message.action === "stopProcessing") {
    console.log("Stopping processing");
    stopProcessing();
    sendResponse({ status: "stopped" });
  }
  return true;
});

window.MeetingAssistant = {
  deepgramSocket: null,
  audioContext: null,
  mediaRecorder: null,
  isRecording: false,
  processingStream: null,
};

async function startDeepgramStream(stream) {
  console.log("Starting Deepgram stream setup");
  const DEEPGRAM_API_KEY = "96f534b1e5c65acaebbe1f1e0e8b76e9176961c7";

  try {
    // Close existing socket if it exists
    if (window.MeetingAssistant.deepgramSocket) {
      console.log("Closing existing Deepgram socket");
      window.MeetingAssistant.deepgramSocket.close();
    }

    console.log("Creating new Deepgram WebSocket connection");
    window.MeetingAssistant.deepgramSocket = new WebSocket(
      `wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=16000&language=auto&model=nova-2`,
      ["token", DEEPGRAM_API_KEY]
    );

    window.MeetingAssistant.deepgramSocket.onopen = () => {
      console.log("Deepgram connection established successfully");
      startAudioProcessing(stream);
    };

    window.MeetingAssistant.deepgramSocket.onerror = (error) => {
      console.error("Deepgram WebSocket error:", error);
    };

    window.MeetingAssistant.deepgramSocket.onclose = () => {
      console.log("Deepgram connection closed");
    };

    window.MeetingAssistant.deepgramSocket.onmessage = async (event) => {
      console.log("Received message from Deepgram");
      try {
        const result = JSON.parse(event.data);
        console.log("Parsed Deepgram result:", result);

        if (result.type === "Results") {
          const transcript = result.channel.alternatives[0].transcript;
          console.log("Transcript:", transcript);

          if (transcript && isQuestion(transcript)) {
            console.log("Question detected:", transcript);
            // Send question to background script for Groq processing
            chrome.runtime.sendMessage(
              {
                action: "processQuestion",
                question: transcript,
              },
              (response) => {
                console.log("Received response from Groq:", response);
                if (response.answer) {
                  console.log("Sending answer to popup:", response.answer);
                  chrome.runtime.sendMessage({
                    action: "newAnswer",
                    question: transcript,
                    answer: response.answer,
                  });
                } else if (response.error) {
                  console.error("Error from Groq:", response.error);
                }
              }
            );
          }
        }
      } catch (error) {
        console.error("Error processing Deepgram message:", error);
      }
    };
  } catch (error) {
    console.error("Error setting up Deepgram connection:", error);
  }
}

function startAudioProcessing(stream) {
  console.log("Starting audio processing");
  try {
    window.MeetingAssistant.audioContext = new AudioContext({
      sampleRate: 16000,
    });

    const source =
      window.MeetingAssistant.audioContext.createMediaStreamSource(stream);
    const processor =
      window.MeetingAssistant.audioContext.createScriptProcessor(4096, 1, 1);

    processor.onaudioprocess = (e) => {
      if (
        window.MeetingAssistant.deepgramSocket?.readyState === WebSocket.OPEN
      ) {
        const inputData = e.inputBuffer.getChannelData(0);
        const pcmData = convertFloat32ToInt16(inputData);
        window.MeetingAssistant.deepgramSocket.send(pcmData);
      }
    };

    source.connect(processor);
    processor.connect(window.MeetingAssistant.audioContext.destination);

    window.MeetingAssistant.processingStream = stream;
    window.MeetingAssistant.isRecording = true;
    console.log("Audio processing started successfully");
  } catch (error) {
    console.error("Error in audio processing setup:", error);
  }
}

function convertFloat32ToInt16(float32Array) {
  const int16Array = new Int16Array(float32Array.length);
  for (let i = 0; i < float32Array.length; i++) {
    const s = Math.max(-1, Math.min(1, float32Array[i]));
    int16Array[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
  }
  return int16Array.buffer;
}

function isQuestion(text) {
  console.log("Checking if text is a question:", text);
  const questionPatterns = [
    /\?$/,
    /^(what|how|why|when|where|who|which|whose|whom|can|could|would|will|do|does|did|is|are|was|were)/i,
    /^tell me/i,
  ];

  const isQuestionResult = questionPatterns.some((pattern) =>
    pattern.test(text.trim())
  );
  console.log("Is question result:", isQuestionResult);
  return isQuestionResult;
}

function stopProcessing() {
  console.log("Stopping all processing");
  try {
    if (window.MeetingAssistant.deepgramSocket) {
      window.MeetingAssistant.deepgramSocket.close();
      window.MeetingAssistant.deepgramSocket = null;
    }

    if (window.MeetingAssistant.audioContext) {
      window.MeetingAssistant.audioContext.close();
      window.MeetingAssistant.audioContext = null;
    }

    if (window.MeetingAssistant.processingStream) {
      window.MeetingAssistant.processingStream
        .getTracks()
        .forEach((track) => track.stop());
      window.MeetingAssistant.processingStream = null;
    }

    window.MeetingAssistant.isRecording = false;
    console.log("All processing stopped successfully");
  } catch (error) {
    console.error("Error stopping processing:", error);
  }
}
