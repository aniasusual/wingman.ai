// background.js
let activeTabId = null;

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    if (message.action === "uploadNotes") {
        chrome.storage.local.set({ notes: message.notes }, () => {
            sendResponse({ status: "Notes successfully saved." });
        });
        return true; // Async response
    } else if (message.action === "getPresentation") {
        chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
            if (tabs[0]) {
                activeTabId = tabs[0].id;
                chrome.storage.local.get(["notes"], (result) => {
                    const presentation = generatePresentation(result.notes || "");
                    chrome.tabs.sendMessage(activeTabId, {
                        action: "displayPresentation",
                        data: presentation,
                    });
                });
            }
        });
    }
});

chrome.tabs.onRemoved.addListener((tabId) => {
    if (tabId === activeTabId) {
        activeTabId = null;
    }
});

function generatePresentation(notes) {
    return `Presentation derived from your notes:\n${notes}\n(Enhanced AI output TBD)`;
}