//background.js
let activeTabId = null;
let transcriptWindowId = null; // Add this to track the window
// let sandboxLoaded = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "captureScreen") {
    // Get the active tab to provide as the context
    chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
      if (!tabs || tabs.length === 0) {
        console.error("No active tab found.");
        sendResponse({ error: "No active tab available" });
        return;
      }

      const activeTab = tabs[0];
      chrome.desktopCapture.chooseDesktopMedia(
        ["screen", "window", "tab"],
        activeTab, // Pass the active tab instead of null or sender.tab
        (streamId) => {
          if (chrome.runtime.lastError) {
            console.error("Desktop capture error:", chrome.runtime.lastError.message);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else if (streamId) {
            console.log("Stream ID received:", streamId);
            sendResponse({ streamId: streamId });
          } else {
            console.log("User canceled screen selection");
            sendResponse({ error: "Screen selection canceled" });
          }
        }
      );
    });
    return true; // Keep the message channel open for async response
  }

  if (message.action === "openSelectionWindow") {
    chrome.system.display.getInfo((displays) => {
      const primaryDisplay = displays[0];
      const width = primaryDisplay.bounds.width;
      const height = primaryDisplay.bounds.height;

      chrome.windows.create(
        {
          url: chrome.runtime.getURL("selection_window.html"),
          type: "popup",
          width: width,
          height: height,
          left: 0,
          top: 0,
        },
        (window) => {
          if (chrome.runtime.lastError) {
            console.error("Error creating window:", chrome.runtime.lastError.message);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            console.log("Window created:", window.id);
            sendResponse({ windowId: window.id });
          }
        }
      );
    });
    return true;
  }

  if (message.action === "closeSelectionWindow") {
    const windowId = message.windowId;
    if (windowId && Number.isInteger(windowId)) {
      chrome.windows.remove(windowId, () => {
        if (chrome.runtime.lastError) {
          console.error("Error closing window:", chrome.runtime.lastError.message);
        } else {
          console.log("Window closed:", windowId);
        }
      });
    }
  }

  if (message.action === "uploadNotes") {
    // console.log("notes: ", message.notes);
    chrome.storage.local.set({ notes: message.notes }, () => {
      sendResponse({ status: "Notes successfully saved." });
    });
    return true;
  }
  if (message.action === "openPresentationWindow") {
    chrome.windows.create(
      {
        url: chrome.runtime.getURL("presentation_window.html"),
        type: "popup",
        width: 600,
        height: 700,
        left: 100,
        top: 50,
      },
      (window) => {
        presentationWindowId = window.id;
        sendResponse({ windowId: presentationWindowId });
      }
    );
    return true;
  }
  if (message.action === "openTranscriptWindow") {
    // Add this to open the window
    chrome.windows.create(
      {
        url: chrome.runtime.getURL("transcript_window.html"),
        type: "popup",
        width: 400,
        height: 600,
        left: 20,
        top: 20,
      },
      (window) => {
        transcriptWindowId = window.id;
        sendResponse({ windowId: transcriptWindowId });
      }
    );
    return true;
  }
  if (message.action === "closeTranscriptWindow") {
    // Add this to close the window
    if (transcriptWindowId) {
      chrome.windows.remove(transcriptWindowId);
      transcriptWindowId = null;
    }
  }

  if (
    message.action === "displayTranscript" ||
    message.action === "displayPresentation"
  ) {
    // Forward messages
    if (transcriptWindowId) {
      chrome.runtime.sendMessage({
        ...message,
        target: "transcriptWindow",
      });
    }
  }
});

chrome.tabs.onRemoved.addListener((tabId) => {
  if (tabId === activeTabId) {
    activeTabId = null;
  }
});

// Add this to clean up the window ID when closed
chrome.windows.onRemoved.addListener((windowId) => {
  if (windowId === transcriptWindowId) {
    transcriptWindowId = null;
  }
});
