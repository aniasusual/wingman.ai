let activeTabId = null;
let transcriptWindowId = null; // Add this to track the window

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.action === "uploadNotes") {
    // console.log("notes: ", message.notes);
    chrome.storage.local.set({ notes: message.notes }, () => {
      sendResponse({ status: "Notes successfully saved." });
    });
    return true;
  } else if (message.action === "openPresentationWindow") {
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
  } else if (message.action === "openTranscriptWindow") {
    // Add this to open the window
    chrome.windows.create(
      {
        url: chrome.runtime.getURL("transcript_window.html"),
        type: "popup",
        width: 450,
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
  } else if (message.action === "closeTranscriptWindow") {
    // Add this to close the window
    if (transcriptWindowId) {
      chrome.windows.remove(transcriptWindowId);
      transcriptWindowId = null;
    }
  } else if (
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
