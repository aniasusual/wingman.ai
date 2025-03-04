// content.js

// Global array to store session transcripts
let sessionTranscripts = [];

function createHelperWindow() {
  // Remove existing helper window if it exists
  const existingWindow = document.getElementById("helperWindow");
  if (existingWindow) {
    existingWindow.remove();
  }

  const helperWindow = document.createElement("div");
  helperWindow.id = "helperWindow";
  helperWindow.innerHTML = `
    <div id="helperHeader">
      <span class="title">Wingman Assistant</span>
      <div class="controls">
        <span class="minimize">−</span>
        <span class="close">×</span>
      </div>
    </div>
    <div id="helperContent">
      <div id="transcriptContainer"></div>
      <div id="downloadContainer" style="margin-top: 10px; text-align: center;">
        <button id="downloadTranscripts" style="
          background-color: #4CAF50; 
          color: white; 
          border: none; 
          padding: 5px 10px; 
          border-radius: 4px; 
          cursor: pointer;
        ">Download Session Transcripts</button>
      </div>
    </div>
  `;
  helperWindow.style.cssText = `
    position: fixed;
    z-index: 10000;
    width: 400px;
    background: #1a1a1a;
    color: #e0e0e0;
    border: 1px solid #333;
    border-radius: 8px;
    box-shadow: 0 5px 15px rgba(0,0,0,0.5), 0 0 1px rgba(255,255,255,0.1);
    font-family: 'Segoe UI', Arial, sans-serif;
    overflow: hidden;
    transition: all 0.3s ease;
  `;
  document.body.appendChild(helperWindow);

  const header = document.getElementById("helperHeader");
  header.style.cssText = `
    cursor: move;
    padding: 10px 15px;
    background: linear-gradient(to bottom, #2a2a2a, #222);
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  const title = header.querySelector(".title");
  title.style.cssText = `
    font-weight: 500;
    letter-spacing: 0.5px;
    font-size: 14px;
    color: gold;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  `;

  const controls = header.querySelector(".controls");
  controls.style.cssText = `
    display: flex;
    gap: 10px;
  `;

  const controlButtons = controls.querySelectorAll("span");
  controlButtons.forEach((button) => {
    button.style.cssText = `
      display: inline-block;
      width: 16px;
      height: 16px;
      text-align: center;
      line-height: 16px;
      border-radius: 50%;
      font-size: 14px;
      cursor: pointer;
      transition: background 0.2s;
    `;
  });

  const minimize = controls.querySelector(".minimize");
  minimize.style.cssText += `background: #555; color: #111;`;
  const close = controls.querySelector(".close");
  close.style.cssText += `background: #555; color: #111;`;

  minimize.addEventListener(
    "mouseover",
    () => (minimize.style.background = "#777")
  );
  minimize.addEventListener(
    "mouseout",
    () => (minimize.style.background = "#555")
  );
  close.addEventListener("mouseover", () => (close.style.background = "#777"));
  close.addEventListener("mouseout", () => (close.style.background = "#555"));

  const contentDiv = document.getElementById("helperContent");
  contentDiv.style.cssText = `
    padding: 15px;
    color: #e0e0e0;
    line-height: 1.5;
    font-size: 13px;
    max-height: 500px;
    overflow-y: auto;
  `;

  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    #helperContent::-webkit-scrollbar {
      width: 6px;
    }
    #helperContent::-webkit-scrollbar-track {
      background: #2a2a2a;
    }
    #helperContent::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 3px;
    }
    #helperContent::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    .transcript-entry {
      background-color: #2a2a2a;
      border-radius: 5px;
      padding: 10px;
      margin-bottom: 10px;
    }
    .transcript-text {
      display: inline-block;
      width: calc(100% - 100px);
      border-bottom: 1px dashed #555;
      padding-bottom: 3px;
    }
  `;
  document.head.appendChild(styleSheet);

  // Dragging functionality
  let isDragging = false;
  let currentX = 20,
    currentY = 20,
    initialX,
    initialY;

  header.addEventListener("mousedown", (e) => {
    isDragging = true;
    initialX = e.clientX - currentX;
    initialY = e.clientY - currentY;
    header.style.cursor = "grabbing";
  });

  document.addEventListener("mousemove", (e) => {
    if (isDragging) {
      e.preventDefault();
      currentX = e.clientX - initialX;
      currentY = e.clientY - initialY;
      helperWindow.style.left = `${currentX}px`;
      helperWindow.style.top = `${currentY}px`;
    }
  });

  document.addEventListener("mouseup", () => {
    isDragging = false;
    header.style.cursor = "grab";
  });

  // Minimize functionality
  minimize.addEventListener("click", () => {
    const currentHeight = contentDiv.style.height;
    if (currentHeight === "0px") {
      contentDiv.style.height = "auto";
      contentDiv.style.padding = "15px";
      minimize.textContent = "−";
    } else {
      contentDiv.style.height = "0px";
      contentDiv.style.padding = "0 15px";
      minimize.textContent = "+";
    }
  });

  // Close functionality
  close.addEventListener("click", () => {
    helperWindow.style.opacity = "0";
    setTimeout(() => helperWindow.remove(), 300);
  });

  // Add download button functionality
  const downloadButton = document.getElementById("downloadTranscripts");
  downloadButton.addEventListener("click", downloadSessionTranscripts);

  // Position and animate window
  helperWindow.style.left = `${currentX}px`;
  helperWindow.style.top = `${currentY}px`;
  helperWindow.style.opacity = "0";
  setTimeout(() => {
    helperWindow.style.opacity = "1";
    helperWindow.style.transition = "opacity 0.5s ease, transform 0.3s ease";
    helperWindow.style.transform = "translateY(0)";
  }, 100);

  return helperWindow;
}

function createTranscriptEntry(transcript, answer) {
  const entryDiv = document.createElement("div");
  entryDiv.className = "transcript-entry";

  // Transcript section
  const transcriptSection = document.createElement("div");
  transcriptSection.innerHTML = `
    <strong>Transcript:</strong> 
    <span class="transcript-text" contenteditable="true">${transcript}</span>
    <button class="edit-submit-btn" style="
      margin-left: 10px; 
      background-color: #4CAF50; 
      color: white; 
      border: none; 
      padding: 3px 7px; 
      border-radius: 3px; 
      cursor: pointer;
    ">Submit Edit</button>
  `;

  // Answer section
  const answerSection = document.createElement("div");
  answerSection.innerHTML = `<strong>Answer:</strong> ${answer}`;

  entryDiv.appendChild(transcriptSection);
  entryDiv.appendChild(answerSection);

  // Add event listener for edit submission
  const editSubmitBtn = entryDiv.querySelector(".edit-submit-btn");
  const transcriptTextSpan = entryDiv.querySelector(".transcript-text");

  editSubmitBtn.addEventListener("click", async () => {
    const editedTranscript = transcriptTextSpan.textContent.trim();

    // Regenerate answer for edited transcript
    const newAnswer = await generateAnswer(editedTranscript);

    // Update the answer section
    answerSection.innerHTML = `<strong>Answer:</strong> ${newAnswer}`;

    // Update the session transcripts array
    const index = sessionTranscripts.findIndex(entry => entry.transcript === transcript);
    if (index !== -1) {
      sessionTranscripts[index] = {
        transcript: editedTranscript,
        answer: newAnswer
      };
    }
  });

  return entryDiv;
}

function updateTranscriptDisplay() {
  const transcriptContainer = document.getElementById("transcriptContainer");
  transcriptContainer.innerHTML = ""; // Clear existing entries

  // Populate with all session transcripts
  sessionTranscripts.forEach(entry => {
    const entryDiv = createTranscriptEntry(entry.transcript, entry.answer);
    transcriptContainer.appendChild(entryDiv);
  });
}

function downloadSessionTranscripts() {
  // Create a formatted text for download
  const transcriptText = sessionTranscripts.map((entry, index) =>
    `Entry ${index + 1}:\nTranscript: ${entry.transcript}\nAnswer: ${entry.answer}\n\n`
  ).join('');

  // Create a Blob and trigger download
  const blob = new Blob([transcriptText], { type: 'text/plain' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `WingmanAssistant_Transcripts_${new Date().toISOString().replace(/:/g, '-')}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function showHelperWindow() {
  createHelperWindow();
}

chrome.runtime.onMessage.addListener(async (message) => {
  const contentDiv = document.getElementById("helperContent");

  if (message.action === "showHelperWindow") {
    showHelperWindow();
  }

  if (message.action === "displayTranscript") {
    if (!contentDiv) {
      showHelperWindow(); // Recreate window if it doesn't exist
    }

    // Generate answer
    const answer = await generateAnswer(message.transcript);

    // Store in session transcripts
    sessionTranscripts.push({
      transcript: message.transcript,
      answer: answer
    });

    // Update display
    updateTranscriptDisplay();
  } else if (message.action === "displayPresentation") {
    if (!contentDiv) {
      showHelperWindow(); // Recreate window if it doesn't exist
    }
    const div = document.getElementById("helperContent"); // Get the new content div
    div.innerText = message.data;
    div.style.opacity = "0";
    setTimeout(() => {
      div.style.opacity = "1";
      div.style.transition = "opacity 0.3s ease";
    }, 50);
  }
});

function generateAnswer(question) {
  const apiKey = "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";
  const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
  return new Promise((resolve) => {
    chrome.storage.local.get(["notes"], async (result) => {
      const notes = result.notes || "No notes uploaded.";
      try {
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
                content:
                  "You are an AI assistant helping a candidate prepare for technical interviews. Provide precise, well-structured, and concise answers (≤250 words) that directly address the interview question. Keep responses clear, to the point, and professional, ensuring they effectively aid in interview preparation.",
              },
              {
                role: "user",
                content: question,
              },
            ],
          }),
        });
        const data = await response.json();

        if (data.choices && data.choices.length > 0)
          resolve(`Response: ${data.choices[0].message.content}`);
        else resolve("Error: No response from AI.");
      } catch (error) {
        console.error("Error fetching AI response:", error);
        resolve("Error: Unable to fetch answer.");
      }
    });
  });
}



