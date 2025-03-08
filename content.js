//content.js

// Remove all UI-related functions and leave only message handling
chrome.runtime.onMessage.addListener(async (message) => {
  if (message.action === "showHelperWindow") {
    // No longer needed, handled by background.js
  }
});