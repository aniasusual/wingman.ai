const apiKey = "REDACTED_SECRET";
const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
const presentationContent = document.getElementById("presentationContent");
const downloadButton = document.getElementById("downloadSummary");
downloadButton.addEventListener("click", downloadNotes);

console.log("Presentation script loaded");

document.addEventListener("DOMContentLoaded", () => {
  console.log("Triggering summarizeNotes() on page load...");
  summarizeNotes();
});

async function summarizeNotes() {
  console.log("Fetching notes from Chrome storage...");
  // Retrieve notes from Chrome storage
  chrome.storage.local.get(["notes"], async (result) => {
    const notes = result.notes || "No notes uploaded.";

    if (!notes || notes.trim() === "No notes uploaded.") {
      console.warn("No notes found, setting fallback message");
      presentationContent.innerText = "No notes available to summarize.";
      return;
    }

    try {
      console.log("Sending request to Groq API...");
      const response = await fetch(apiUrl, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify({
          model: "llama-3.3-70b-versatile",
          messages: [
            {
              role: "system",
              content: `Summarize the provided notes in a structured, concise format. The length of the summary should dynamically adjust based on the length of the notes:

    - **If the notes are short (1 page or less):** Provide a **brief yet informative summary** that retains all key points but remains **engaging and easy to read**.

    - **If the notes are long (multiple pages):** Create a **structured summary** with the **main point(s) from each page** in a way that a user can **quickly grasp what each page covers**.

    - **Ensure clarity and readability**—keep the summary **direct, well-organized, and free of unnecessary details**. 
    
    - Do **not** explicitly mention page numbers unless necessary. Instead, logically structure the summary for easy understanding.`,
            },
            {
              role: "user",
              content: notes,
            },
          ],
        }),
      });

      const data = await response.json();
      console.log("API Response:", data);

      if (data.choices && data.choices.length > 0) {
        const summary = data.choices[0].message.content;
        presentationContent.innerText = summary;
      } else {
        console.error("Error: No summary generated.");
        presentationContent.innerText = "Error: No summary generated.";
      }
    } catch (error) {
      console.error("Error fetching AI response:", error);
      presentationContent.innerText = "Error: Unable to fetch summary.";
    }
  });
}

function downloadNotes() {
  const text = presentationContent.innerText;
  const blob = new Blob([text], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Notes_Summary_${new Date()
    .toISOString()
    .replace(/:/g, "-")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}
