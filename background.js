//background.js
let activeTabId = null;
let transcriptWindowId = null; // Add this to track the window
// let sandboxLoaded = false;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {

  if (message.action === "openSelectionWindow") {
    chrome.system.display.getInfo((displays) => {
      const primaryDisplay = displays[0]; // Use the primary display
      const width = primaryDisplay.bounds.width;
      const height = primaryDisplay.bounds.height;

      console.log("URL:", chrome.runtime.getURL("selection_window.html"));

      chrome.windows.create(
        {
          url: chrome.runtime.getURL("selection_window.html"),
          type: "popup",
          width: width,
          height: height,
          left: 0,
          top: 0,
          // state: "fullscreen",
        },
        (window) => {
          if (chrome.runtime.lastError) {
            console.error("Error creating window:", chrome.runtime.lastError);
            sendResponse({ error: chrome.runtime.lastError.message });
          } else {
            console.log("window: ", window);
            sendResponse({ windowId: window.id });
          }
        }
      );
    });
    return true;
  }

  // NEW: Close selection window
  if (message.action === "closeSelectionWindow") {
    const windowId = message.windowId;
    if (windowId && Number.isInteger(windowId)) {
      chrome.windows.remove(windowId, () => {
        if (chrome.runtime.lastError) {
          console.error("Error closing selection window:", chrome.runtime.lastError);
        } else {
          console.log("Selection window closed:", windowId);
        }
      });
    } else {
      console.error("Invalid or missing windowId for closeSelectionWindow:", windowId);
    }
  }

  // NEW: Capture screen
  if (message.action === "captureScreen") {
    chrome.desktopCapture.chooseDesktopMedia(
      ["screen", "window", "tab"],
      sender.tab,
      (streamId) => {
        sendResponse({ streamId: streamId });
      }
    );
    return true;
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
