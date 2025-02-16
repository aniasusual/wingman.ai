let activeTabId = null;
console.log("Background script loaded");

// chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
//   console.log("Message received in background:", message);
//   if (message.action === "startTabCapture") {
//     chrome.tabCapture.capture(
//       {
//         audio: true,
//         video: false,
//       },
//       (stream) => {
//         if (chrome.runtime.lastError) {
//           console.error("Tab capture error:", chrome.runtime.lastError);
//           sendResponse({ error: chrome.runtime.lastError.message });
//           return;
//         }

//         console.log("Tab capture started successfully");
//         sendResponse({ streamId: stream.id });
//       }
//     );
//     return true;
//   }
// });

async function processWithGroq(question) {
  console.log("Sending request to Groq API");
  const GROQ_API_KEY =
    "REDACTED_SECRET";
  try {
    const response = await fetch("https://api.groq.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${GROQ_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mixtral-8x7b-32768",
        messages: [
          {
            role: "system",
            content:
              "You are a helpful AI assistant providing concise, accurate answers to interview questions.",
          },
          {
            role: "user",
            content: question,
          },
        ],
        temperature: 0.7,
        max_tokens: 500,
      }),
    });

    const data = await response.json();
    console.log("Groq API response:", data);
    return data.choices[0].message.content;
  } catch (error) {
    console.error("Error in Groq API call:", error);
    throw error;
  }
}
