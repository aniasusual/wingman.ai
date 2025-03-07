// // popup.js
// const toggleButton = document.getElementById("toggleButton");
// let isRunning = false;
// let capturedStream = null;
// let audioContext = null;
// let socket = null;
// let processor = null;

// toggleButton.addEventListener("click", () => {
//   if (!isRunning) {

//     chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//       if (tabs[0]) {
//         chrome.tabs.sendMessage(tabs[0].id, { action: "showHelperWindow" });
//       }
//     });

//     if (!chrome.tabCapture) {
//       console.error("tabCapture API not available.");
//       document.getElementById("status").textContent = "Tab capture not available.";
//       return;
//     }

//     chrome.tabCapture.capture(
//       {
//         audio: true,
//         video: false,
//         audioConstraints: { mandatory: { echoCancellation: true } },
//       },
//       (systemStream) => {
//         if (chrome.runtime.lastError) {
//           console.error("System capture failed:", chrome.runtime.lastError);
//           document.getElementById("status").textContent = "Failed to capture audio.";
//           return;
//         }

//         capturedStream = systemStream;

//         // Clone the stream and play it locally if needed
//         const clonedStream = capturedStream.clone();
//         const audioElement = new Audio();
//         audioElement.srcObject = clonedStream;
//         audioElement.play().catch((error) => {
//           console.error("Audio playback failed:", error);
//           document.getElementById("status").textContent = "Audio playback error.";
//         });

//         // Set up WebSocket connection to Deepgram
//         socket = new WebSocket("wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=48000", [
//           "token",
//           "96f534b1e5c65acaebbe1f1e0e8b76e9176961c7", // Replace with your Deepgram API key
//         ]);

//         socket.onopen = () => {
//           // Set up Web Audio API for real-time processing
//           audioContext = new AudioContext();
//           const source = audioContext.createMediaStreamSource(systemStream);

//           // Create a script processor node to process audio in real-time
//           // Note: ScriptProcessorNode is deprecated but still widely supported
//           // Consider using AudioWorklet for production code
//           processor = audioContext.createScriptProcessor(4096, 1, 1);

//           processor.onaudioprocess = (e) => {
//             if (socket.readyState === WebSocket.OPEN) {
//               // Get the raw audio data
//               const inputData = e.inputBuffer.getChannelData(0);

//               // Convert to 16-bit PCM (Int16Array)
//               const pcmData = new Int16Array(inputData.length);
//               for (let i = 0; i < inputData.length; i++) {
//                 // Convert float32 to int16
//                 pcmData[i] = Math.min(1, Math.max(-1, inputData[i])) * 32767;
//               }

//               // Send the raw PCM data to Deepgram
//               socket.send(pcmData.buffer);
//             }
//           };

//           // Connect the nodes
//           source.connect(processor);
//           processor.connect(audioContext.destination);

//           document.getElementById("status").textContent = "Listening...";
//           toggleButton.textContent = "Stop Assistant";
//           isRunning = true;
//         };

//         socket.onmessage = (message) => {
//           const data = JSON.parse(message.data);
//           const transcript = data.channel?.alternatives[0]?.transcript || "";
//           if (transcript) {
//             chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
//               if (tabs[0]) {
//                 chrome.tabs.sendMessage(tabs[0].id, {
//                   action: "displayTranscript",
//                   transcript: transcript,
//                 });
//               }
//             });
//           }
//         };

//         socket.onclose = () => {
//           console.log("WebSocket closed.");
//         };

//         socket.onerror = (error) => {
//           console.error("WebSocket error:", error);
//           document.getElementById("status").textContent = "Transcription error.";
//         };
//       }
//     );
//   } else {
//     // Clean up and stop streaming
//     if (processor) {
//       processor.disconnect();
//       processor = null;
//     }

//     if (audioContext) {
//       audioContext.close();
//       audioContext = null;
//     }

//     if (socket) {
//       socket.close();
//       socket = null;
//     }

//     if (capturedStream) {
//       capturedStream.getTracks().forEach((track) => track.stop());
//       capturedStream = null;
//     }

//     document.getElementById("status").textContent = "Stopped.";
//     toggleButton.textContent = "Start Assistant";
//     isRunning = false;
//   }
// });

// document.getElementById("notesUpload").addEventListener("change", (event) => {
//   const file = event.target.files[0];
//   if (file) {
//     const reader = new FileReader();
//     reader.onload = (e) => {
//       chrome.runtime.sendMessage(
//         { action: "uploadNotes", notes: e.target.result },
//         (response) => {
//           alert(response.status);
//         }
//       );
//     };
//     reader.readAsText(file);
//   }
// });

// document.getElementById("generatePresentation").addEventListener("click", () => {
//   chrome.runtime.sendMessage({ action: "getPresentation" });
// });


const toggleButton = document.getElementById("toggleButton");
let isRunning = false;
let capturedStream = null;
let audioContext = null;
let socket = null;
let processor = null;
let transcriptionBuffer = "";
let bufferTimeout = null;

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

        const clonedStream = capturedStream.clone();
        const audioElement = new Audio();
        audioElement.srcObject = clonedStream;
        audioElement.play().catch((error) => {
          console.error("Audio playback failed:", error);
          document.getElementById("status").textContent = "Audio playback error.";
        });

        socket = new WebSocket("wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=48000", [
          "token",
          "96f534b1e5c65acaebbe1f1e0e8b76e9176961c7", // Replace with your Deepgram API key
        ]);

        socket.onopen = () => {
          audioContext = new AudioContext();
          const source = audioContext.createMediaStreamSource(systemStream);

          processor = audioContext.createScriptProcessor(4096, 1, 1);

          processor.onaudioprocess = (e) => {
            if (socket.readyState === WebSocket.OPEN) {
              const inputData = e.inputBuffer.getChannelData(0);
              const pcmData = new Int16Array(inputData.length);
              for (let i = 0; i < inputData.length; i++) {
                pcmData[i] = Math.min(1, Math.max(-1, inputData[i])) * 32767;
              }
              socket.send(pcmData.buffer);
            }
          };

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
            transcriptionBuffer += " " + transcript.trim();

            // Send the current buffer to update the UI
            chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
              if (tabs[0]) {
                chrome.tabs.sendMessage(tabs[0].id, {
                  action: "displayTranscript",
                  transcript: transcriptionBuffer.trim(),
                  isFinal: false
                });
              }
            });

            // Reset timeout to wait for more fragments
            clearTimeout(bufferTimeout);
            bufferTimeout = setTimeout(() => {
              processBufferedTranscription(transcriptionBuffer.trim());
              transcriptionBuffer = "";
            }, 1000); // 1-second pause to consider sentence complete
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

// function shouldQueryAPI(transcript) {
//   const questionStarters = ["what", "how", "why", "when", "where", "who", "can", "could", "tell me"];
//   const lowerTranscript = transcript.toLowerCase();
//   return (
//     questionStarters.some(starter => lowerTranscript.startsWith(starter)) ||
//     lowerTranscript.endsWith("?") ||
//     lowerTranscript.includes("explain") ||
//     lowerTranscript.includes("describe")
//   );
// }


function shouldQueryAPI(transcript) {
  // Normalize transcript for consistent analysis
  const cleanedTranscript = transcript.trim().toLowerCase();
  if (!cleanedTranscript) return false; // Empty or whitespace-only input

  // Comprehensive list of question starters (expanded for DSA, interviews, meetings, etc.)
  const questionStarters = [
    "what", "how", "why", "when", "where", "who", "whose", "which", "can", "could",
    "would", "will", "is", "are", "does", "do", "did", "should", "might", "tell me",
    "give me", "show me", "explain", "describe", "define", "clarify", "elaborate",
    "walk me through", "break down", "demonstrate", "illustrate", "outline",
    "summarize", "provide", "list", "enumerate", "compare", "contrast", "analyze",
    "solve", "implement", "code", "design", "optimize", "debug", "test",
    "present", "prepare", "discuss", "review", "evaluate", "assess", "justify",
    "prove", "verify", "check", "calculate", "compute", "estimate", "predict"
  ];

  // Keywords indicating intent (commands or clarifications)
  const intentKeywords = [
    "question", "answer", "solution", "example", "approach", "method", "technique",
    "algorithm", "data structure", "complexity", "time", "space", "performance",
    "step", "steps", "process", "procedure", "strategy", "pattern", "best practice",
    "interview", "presentation", "slide", "meeting", "agenda", "point", "detail",
    "definition", "meaning", "concept", "theory", "application", "use case",
    "problem", "exercise", "task", "challenge", "query", "request", "help",
    "assistance", "guide", "tutorial", "overview", "intro", "introduction"
  ];

  // Common endings or punctuation indicating a query
  const queryEndings = ["?", "please", "..."]; // Ellipsis for incomplete questions

  // Check for question starters at the beginning
  const startsWithQuestion = questionStarters.some(starter =>
    cleanedTranscript.startsWith(starter + " ") || cleanedTranscript === starter
  );

  // Check for intent keywords anywhere in the transcript
  const containsIntent = intentKeywords.some(keyword =>
    cleanedTranscript.includes(" " + keyword + " ") ||
    cleanedTranscript.endsWith(" " + keyword) ||
    cleanedTranscript.startsWith(keyword + " ")
  );

  // Check for query endings
  const endsWithQuery = queryEndings.some(ending =>
    cleanedTranscript.endsWith(ending)
  );

  // Specific DSA/Interview/Presentation triggers (contextual phrases)
  const contextualTriggers = [
    "sort", "search", "traverse", "insert", "delete", "merge", "heap", "tree",
    "graph", "array", "list", "stack", "queue", "hash", "map", "set", "binary",
    "dynamic", "greedy", "recursion", "backtracking", "divide and conquer",
    "big o", "runtime", "space complexity", "leetcode", "hackerrank", "codeforces",
    "system design", "architecture", "scalability", "database", "api", "network",
    "next slide", "previous slide", "current slide", "agenda item", "action item",
    "meeting notes", "key takeaway", "summary of", "overview of"
  ];

  const containsContext = contextualTriggers.some(trigger =>
    cleanedTranscript.includes(" " + trigger + " ") ||
    cleanedTranscript.endsWith(" " + trigger) ||
    cleanedTranscript.startsWith(trigger + " ")
  );

  // Advanced heuristic: detect multi-word questions or commands
  const words = cleanedTranscript.split(/\s+/);
  const hasVerbNounCombo = questionStarters.some(starter =>
    words[0] === starter && words.length > 1 &&
    !["i", "you", "he", "she", "it", "we", "they"].includes(words[1])
  );

  // Final decision: trigger API if any strong indicator is present
  return (
    startsWithQuestion ||        // Explicit question starters
    endsWithQuery ||             // Ends with ?, please, or ...
    containsIntent ||            // Contains intent keywords
    containsContext ||           // Contains DSA/interview/presentation context
    hasVerbNounCombo             // Verb + noun structure (e.g., "explain recursion")
  );
}

function processBufferedTranscription(transcript) {
  if (shouldQueryAPI(transcript)) {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "displayTranscript",
          transcript: transcript,
          isFinal: true
        });
      }
    });
  } else {
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (tabs[0]) {
        chrome.tabs.sendMessage(tabs[0].id, {
          action: "displayTranscript",
          transcript: transcript,
          isFinal: false
        });
      }
    });
  }
}

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