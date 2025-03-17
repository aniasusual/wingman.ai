const toggleButton = document.getElementById("toggleButton");
let isRunning = false;
let capturedStream = null;
let audioContext = null;
let socket = null;
let processor = null;
let transcriptionBuffer = "";
let bufferTimeout = null;
let transcriptWindowId = null; // Add this to track the new window

document.addEventListener("DOMContentLoaded", () => {
  initializeSandbox();

  const firebaseConfig = {
    apiKey: "REDACTED_SECRET",
    authDomain: "wingman-3d684.firebaseapp.com",
    projectId: "wingman-3d684",
    storageBucket: "wingman-3d684.appspot.com",
    appId: "1:156676475531:web:93faa1e23674e68626e28e",
  };

  firebase.initializeApp(firebaseConfig);
  const auth = firebase.auth();
  // const db = firebase.firestore();

  const loginContainer = document.getElementById("loginContainer");
  const mainContent = document.getElementById("mainContent");
  const googleSignIn = document.getElementById("googleSignIn");
  // const logoutButton = document.getElementById("logoutButton");

  auth.onAuthStateChanged((user) => {
    if (user) {
      loginContainer.classList.add("hidden");
      mainContent.classList.remove("hidden");
      console.log("User signed in:", user.email);

      // Store user data in Firestore
      // db.collection('users').doc(user.uid).set({
      //   email: user.email,
      //   lastLogin: firebase.firestore.FieldValue.serverTimestamp()
      // }, { merge: true })
      // .catch((error) => {
      //   console.error("Error storing user data:", error);
      // });
    } else {
      loginContainer.classList.remove("hidden");
      mainContent.classList.add("hidden");
    }
  });

  // logoutButton.addEventListener("click", () => {
  //   auth.signOut().then(() => {
  //     console.log("User signed out");
  //   }).catch((error) => {
  //     console.error("Sign out error:", error);
  //   });
  // });

  googleSignIn.addEventListener("click", () => {
    chrome.identity.getAuthToken({ interactive: true }, function (token) {
      if (chrome.runtime.lastError) {
        console.error(chrome.runtime.lastError);
        return;
      }
      // Create credential with the token
      const credential = firebase.auth.GoogleAuthProvider.credential(
        null,
        token
      );
      // Sign in with credential
      auth
        .signInWithCredential(credential)
        .then((result) => {
          console.log("Successfully signed in with Firebase");
        })
        .catch((error) => {
          console.error("Firebase sign-in error:", error);
        });
    });
  });
});

// Ensure pdfjsLib is available globally
if (typeof pdfjsLib === "undefined") {
  console.error("pdf.js not loaded correctly.");
  statusDiv.textContent = "Error: PDF processing unavailable.";
} else {
  pdfjsLib.GlobalWorkerOptions.workerSrc = "./lib/pdf.worker.min.js"; // Point to the local script
}

if (typeof JSZip === "undefined") {
  console.error("JSZip not loaded correctly.");
  document.getElementById("status").textContent =
    "Error: PPTX processing unavailable.";
}

toggleButton.addEventListener("click", () => {
  if (!isRunning) {
    // Open the new transcript window
    chrome.runtime.sendMessage(
      { action: "openTranscriptWindow" },
      (response) => {
        transcriptWindowId = response.windowId;
      }
    );

    if (!chrome.tabCapture) {
      console.error("tabCapture API not available.");
      document.getElementById("status").textContent =
        "Tab capture not available.";
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
          document.getElementById("status").textContent =
            "Failed to capture audio.";
          return;
        }

        capturedStream = systemStream;

        const clonedStream = capturedStream.clone();
        const audioElement = new Audio();
        audioElement.srcObject = clonedStream;
        audioElement.play().catch((error) => {
          console.error("Audio playback failed:", error);
          document.getElementById("status").textContent =
            "Audio playback error.";
        });

        socket = new WebSocket(
          "wss://api.deepgram.com/v1/listen?encoding=linear16&sample_rate=48000",
          [
            "token",
            "96f534b1e5c65acaebbe1f1e0e8b76e9176961c7", // Replace with your Deepgram API key
          ]
        );

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

            // Send to the new window via background script
            chrome.runtime.sendMessage({
              action: "displayTranscript",
              transcript: transcriptionBuffer.trim(),
              isFinal: false,
              windowId: transcriptWindowId,
            });

            clearTimeout(bufferTimeout);
            bufferTimeout = setTimeout(() => {
              processBufferedTranscription(transcriptionBuffer.trim());
              transcriptionBuffer = "";
            }, 1000);
          }
        };

        socket.onclose = () => {
          console.log("WebSocket closed.");
        };

        socket.onerror = (error) => {
          console.error("WebSocket error:", error);
          document.getElementById("status").textContent =
            "Transcription error.";
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

    // Close the transcript window
    chrome.runtime.sendMessage({
      action: "closeTranscriptWindow",
      windowId: transcriptWindowId,
    });
    transcriptWindowId = null;
  }
});

let modelReady = false;
let sandboxIframe = null;

function initializeSandbox() {
  if (!modelReady && !sandboxIframe) {
    console.log("Initializing sandbox...");
    const sandboxUrl = chrome.runtime.getURL("sandbox.html");

    sandboxIframe = document.createElement("iframe");
    sandboxIframe.src = sandboxUrl;
    sandboxIframe.style.display = "none";
    document.body.appendChild(sandboxIframe);
  }
}

window.addEventListener("message", (event) => {
  if (event.data && event.data.action === "modelLoaded") {
    if (event.data.status === "success") {
      modelReady = true;
      console.log("Sandbox model ready.");
    } else {
      console.error("Sandbox model failed to load:", event.data.error);
      document.getElementById("status").textContent =
        "Error initializing model.";
    }
  } else if (event.data && event.data.action === "predictionResult") {
    const { callbackId, result } = event.data;
    const callback = pendingPredictions[callbackId];
    if (callback) {
      callback(result);
      delete pendingPredictions[callbackId];
    }
  }
});

const pendingPredictions = {};
let callbackCounter = 0;

async function shouldQueryAPI(transcript) {
  if (!modelReady) {
    console.error("Model not ready yet.");
    return false;
  }

  return new Promise((resolve) => {
    const callbackId = ++callbackCounter;
    pendingPredictions[callbackId] = resolve;

    sandboxIframe.contentWindow.postMessage(
      {
        action: "predict",
        transcript,
        callbackId,
      },
      "*"
    );
  });
}

document.addEventListener("DOMContentLoaded", () => {
  initializeSandbox();
});

function processBufferedTranscription(transcript) {
  if (shouldQueryAPI(transcript)) {
    chrome.runtime.sendMessage({
      action: "displayTranscript",
      transcript: transcript,
      isFinal: true,
      windowId: transcriptWindowId,
    });
  } else {
    chrome.runtime.sendMessage({
      action: "displayTranscript",
      transcript: transcript,
      isFinal: false,
      windowId: transcriptWindowId,
    });
  }
}

document.getElementById("notesUpload").addEventListener("change", (event) => {
  const file = event.target.files[0];
  if (file) {
    const fileType = file.name.split(".").pop().toLowerCase();
    const documentContentDiv = document.getElementById("documentContent");
    const fileNameSpan = document.getElementById("fileName");

    // Display the currently uploaded file name
    fileNameSpan.textContent = `Uploaded: ${file.name}`;

    // Create file display element
    const fileElement = document.createElement("div");
    fileElement.className = "file-item";

    // Create file name element with appropriate icon
    let fileIcon = "📄";
    if (fileType === "pdf") fileIcon = "📕";
    if (fileType === "pptx") fileIcon = "📊";

    const fileNameElement = document.createElement("div");
    fileNameElement.className = "file-name";
    // fileNameElement.innerHTML = `<span class="file-icon">${fileIcon}</span> ${file.name}`;
    fileNameElement.innerHTML = `${file.name}`;
    fileElement.appendChild(fileNameElement);

    // Create scrollable content container
    const contentContainer = document.createElement("div");
    contentContainer.className = "file-content-container";

    // Create content element
    const contentElement = document.createElement("div");
    contentElement.className = "file-content";
    contentContainer.appendChild(contentElement);
    fileElement.appendChild(contentContainer);

    // Process file based on type
    if (fileType === "txt") {
      const reader = new FileReader();
      reader.onload = (e) => {
        const content = e.target.result;
        contentElement.textContent = content;
        documentContentDiv.appendChild(fileElement);

        chrome.runtime.sendMessage(
          { action: "uploadNotes", notes: content, fileName: file.name },
          (response) => {
            document.getElementById("status").textContent = response.status;
          }
        );
      };
      reader.readAsText(file);
    } else if (fileType === "pdf") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const typedArray = new Uint8Array(e.target.result);
          const loadingTask = pdfjsLib.getDocument(typedArray);
          const pdf = await loadingTask.promise;
          let textContent = "";

          contentElement.textContent = "Loading PDF content...";
          documentContentDiv.appendChild(fileElement);

          for (let i = 1; i <= pdf.numPages; i++) {
            const page = await pdf.getPage(i);
            const text = await page.getTextContent();
            textContent += `--- Page ${i} ---\n`;
            textContent +=
              text.items.map((item) => item.str).join(" ") + "\n\n";
          }

          contentElement.textContent = textContent;

          chrome.runtime.sendMessage(
            {
              action: "uploadNotes",
              notes: textContent,
              fileName: file.name,
            },
            (response) => {
              document.getElementById("status").textContent = response.status;
            }
          );
        } catch (error) {
          console.error("PDF parsing error: ", error);
          contentElement.textContent = "Error extracting text from PDF.";
          documentContentDiv.appendChild(fileElement);
        }
      };
      reader.readAsArrayBuffer(file);
    } else if (fileType === "pptx" || fileType === "ppt") {
      const reader = new FileReader();
      reader.onload = async (e) => {
        try {
          const arrayBuffer = e.target.result;

          contentElement.textContent = "Loading PPTX content...";
          documentContentDiv.appendChild(fileElement);

          const zip = await JSZip.loadAsync(arrayBuffer);
          let textContent = "";

          // PPTX files store slide content in XML files
          const slideFiles = Object.keys(zip.files).filter((filename) =>
            filename.match(/^ppt\/slides\/slide\d+\.xml$/)
          );

          for (const slideFile of slideFiles.sort((a, b) => {
            const numA = parseInt(a.match(/slide(\d+)\.xml/)[1]);
            const numB = parseInt(b.match(/slide(\d+)\.xml/)[1]);
            return numA - numB;
          })) {
            const slideNumber = slideFile.match(/slide(\d+)\.xml/)[1];
            const xmlText = await zip.file(slideFile).async("string");
            const parser = new DOMParser();
            const xmlDoc = parser.parseFromString(xmlText, "text/xml");
            const textNodes = xmlDoc.getElementsByTagName("a:t");

            textContent += `--- Slide ${slideNumber} ---\n`;
            for (let i = 0; i < textNodes.length; i++) {
              textContent += textNodes[i].textContent + " ";
            }
            textContent += "\n\n";
          }

          contentElement.textContent =
            textContent || "No text extracted from PPTX.";

          chrome.runtime.sendMessage(
            {
              action: "uploadNotes",
              notes: textContent,
              fileName: file.name,
              fileType: "pptx",
            },
            (response) => {
              document.getElementById("status").textContent = response.status;
            }
          );
        } catch (error) {
          console.error("PPTX parsing error: ", error);
          contentElement.textContent = "Error extracting text from PPTX.";
        }
      };
      reader.readAsArrayBuffer(file);
    } else {
      contentElement.textContent = "Unsupported file type.";
      documentContentDiv.appendChild(fileElement);
      fileNameSpan.textContent = `Uploaded: ${file.name} (Unsupported)`;
    }

    document.getElementById("status").textContent =
      "File uploaded successfully.";
  }
});

document
  .getElementById("generatePresentation")
  .addEventListener("click", () => {
    chrome.runtime.sendMessage({ action: "openPresentationWindow" });
  });
