// // popup.js
// let capturedStream = null;

// document.getElementById("start").addEventListener("click", () => {
//   startCapture();
// });

// document.getElementById("stop").addEventListener("click", () => {
//   stopCapture();
// });

// function stopCapture() {
//   if (capturedStream) {
//     capturedStream.getTracks().forEach((track) => track.stop());
//     capturedStream = null;
//   }

//   chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//     if (tabs.length === 0) return;

//     chrome.scripting.executeScript({
//       target: { tabId: tabs[0].id },
//       func: () => {
//         if (window.recorder) {
//           window.recorder.stop();
//           console.log("Transcription stopped.");
//         }
//       },
//     });
//   });

//   // Update UI
//   document.getElementById("start").style.display = "block";
//   document.getElementById("stop").style.display = "none";
//   document.getElementById("status").textContent = "ready to go!";
// }



// function startCapture() {
//   if (!chrome.tabCapture) {
//     console.error("tabCapture API not available in this context.");
//     return;
//   }

//   chrome.tabCapture.capture(
//     {
//       audio: true,
//       video: false,
//       audioConstraints: { mandatory: { echoCancellation: true } },
//     },
//     async function (systemStream) {
//       if (chrome.runtime.lastError) {
//         console.error("System capture failed:", chrome.runtime.lastError);
//         return;
//       }

//       capturedStream = systemStream;

//       // Only play the system audio (other person's voice)
//       const audioContext = new AudioContext();
//       const source = audioContext.createMediaStreamSource(systemStream);
//       const destination = audioContext.destination;
//       source.connect(destination);

//       chrome.tabs.query({ active: true, currentWindow: true }, function (tabs) {
//         if (tabs.length === 0) return;

//         chrome.scripting.executeScript({
//           target: { tabId: tabs[0].id },
//           function: injectStream,
//           args: [systemStream.id],
//         });
//       });

//       document.getElementById("start").style.display = "none";
//       document.getElementById("stop").style.display = "block";
//       document.getElementById("status").textContent = "listening to both parties...";
//     }
//   );
// }

// function injectStream(streamId) {
//     navigator.mediaDevices.getUserMedia({
//         audio: {
//             deviceId: streamId,
//             echoCancellation: true,
//             noiseSuppression: true
//         }
//     })
//         .then((stream) => {
//             window.postMessage({
//                 action: "start_transcription",
//                 streamId: stream.id
//             }, "*");
//         })
//         .catch((error) => {
//             console.error("Failed to access captured audio:", error);
//         });
// }


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

        // Define the injection function inline
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          func: (streamId) => {
            // This function will run in the context of the web page
            navigator.mediaDevices.getUserMedia({
              audio: {
                deviceId: streamId,
                echoCancellation: true,
                noiseSuppression: true
              }
            })
              .then(systemStream => {
                return navigator.mediaDevices.getUserMedia({
                  audio: {
                    echoCancellation: true,
                    noiseSuppression: true
                  }
                })
                  .then(micStream => {
                    // Send the streams to content script via message
                    window.postMessage({
                      type: 'STREAMS_READY',
                      systemStreamId: systemStream.id,
                      micStreamId: micStream.id
                    }, '*');
                  });
              })
              .catch(error => {
                console.error("Failed to access audio streams:", error);
              });
          },
          args: [systemStream.id]
        });
      });

      document.getElementById("start").style.display = "none";
      document.getElementById("stop").style.display = "block";
      document.getElementById("status").textContent = "listening to both parties...";
    }
  );
}

