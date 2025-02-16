console.log("Popup script loaded");

document.addEventListener("DOMContentLoaded", async () => {
  console.log("Popup DOM loaded");

  const startBtn = document.getElementById("start");
  const stopBtn = document.getElementById("stop");
  const qaContainer = document.getElementById("qa-container");

  startBtn.addEventListener("click", async () => {
    console.log("Start button clicked");

    try {
      const [tab] = await chrome.tabs.query({
        active: true,
        currentWindow: true,
      });

      console.log("Active tab:", tab);

      // ✅ Inject content script if not already injected
      await chrome.scripting.executeScript({
        target: { tabId: tab.id },
        files: ["content.js"],
      });

      console.log("Content script injected successfully");

      // ✅ Start tab capture directly in `popup.js`
      chrome.tabCapture.capture(
        {
          audio: true,
          video: false,
        },
        (stream) => {
          if (chrome.runtime.lastError) {
            console.error("Tab capture error:", chrome.runtime.lastError);
            return;
          }

          console.log("Tab capture started successfully");
          const tracks = stream.getAudioTracks();

          if (tracks.length > 0) {
            chrome.tabs.sendMessage(tab.id, {
              action: "startProcessing",
              streamId: stream.id,
            });

            window.capturedStream = stream;

            startBtn.style.display = "none";
            stopBtn.style.display = "block";
          } else {
            console.error("No audio tracks found in the captured stream");
          }
        }
      );
    } catch (error) {
      console.error("Error starting capture:", error);
    }
  });

  stopBtn.addEventListener("click", () => {
    console.log("Stop button clicked");
    if (window.capturedStream) {
      window.capturedStream.getTracks().forEach((track) => track.stop());
      window.capturedStream = null;
    }

    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      chrome.tabs.sendMessage(tabs[0].id, { action: "stopProcessing" });
      startBtn.style.display = "block";
      stopBtn.style.display = "none";
    });
  });

  // ✅ Listen for AI answers from background
  chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Received message in popup script:", message);

    if (message.action === "newAnswer") {
      console.log("Received AI response from background:", message.answer);
      const qaContainer = document.getElementById("qa-container");

      const qaItem = document.createElement("div");
      qaItem.className = "qa-item";
      qaItem.innerHTML = `<div class="question">Q: ${message.question}</div>
                                <div class="answer">A: ${message.answer}</div>`;

      qaContainer.prepend(qaItem);
    }
  });
});
