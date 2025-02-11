// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed");
});

chrome.action.onClicked.addListener((tab) => {
    console.log("Extension icon clicked");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received in background.js:", message);

    if (message.action === "test") {
        console.log("Test message received from content.js!");
        sendResponse({ response: "Hello from background.js!" });
    }
});