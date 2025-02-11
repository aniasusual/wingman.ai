// background.js

chrome.runtime.onInstalled.addListener(() => {
    console.log("Extension Installed");
});

chrome.action.onClicked.addListener((tab) => {
    console.log("Extension icon clicked");
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    console.log("Message received:", message);
    sendResponse({ response: "Message received" });
});
