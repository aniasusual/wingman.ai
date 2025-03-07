// let sessionTranscripts = [];

// function createHelperWindow() {
//   const existingWindow = document.getElementById("helperWindow");
//   if (existingWindow) {
//     existingWindow.remove();
//   }

//   const helperWindow = document.createElement("div");
//   helperWindow.id = "helperWindow";
//   helperWindow.innerHTML = `
//     <div id="helperHeader">
//       <span class="title">Wingman Assistant</span>
//       <div class="controls">
//         <span class="minimize">−</span>
//         <span class="close">×</span>
//       </div>
//     </div>
//     <div id="helperContent">
//       <div id="transcriptContainer"></div>
//       <div id="downloadContainer">
//         <button id="downloadTranscripts" class="elegant-btn">Download Transcripts</button>
//       </div>
//     </div>
//   `;
//   helperWindow.style.cssText = `
//     position: fixed;
//     z-index: 10000;
//     width: 450px;
//     background: #121212;
//     color: #e0e0e0;
//     border: 1px solid #333;
//     border-radius: 12px;
//     box-shadow: 0 10px 25px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1);
//     font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
//     overflow: hidden;
//     transition: all 0.3s ease;
//   `;
//   document.body.appendChild(helperWindow);

//   const header = document.getElementById("helperHeader");
//   header.style.cssText = `
//     cursor: move;
//     padding: 12px 15px;
//     background: linear-gradient(to bottom, #1f1f1f, #161616);
//     border-bottom: 1px solid #333;
//     display: flex;
//     justify-content: space-between;
//     align-items: center;
//   `;

//   const title = header.querySelector(".title");
//   title.style.cssText = `
//     font-weight: 600;
//     letter-spacing: 0.5px;
//     font-size: 15px;
//     color: #ffd700;
//     text-shadow: 0 1px 2px rgba(0,0,0,0.3);
//   `;

//   const controls = header.querySelector(".controls");
//   controls.style.cssText = `
//     display: flex;
//     gap: 10px;
//   `;

//   const minimizeBtn = controls.querySelector(".minimize");
//   const closeBtn = controls.querySelector(".close");

//   const controlButtons = controls.querySelectorAll("span");
//   controlButtons.forEach((button) => {
//     button.style.cssText = `
//       display: inline-block;
//       width: 18px;
//       height: 18px;
//       text-align: center;
//       line-height: 18px;
//       border-radius: 50%;
//       font-size: 14px;
//       cursor: pointer;
//       transition: all 0.2s ease;
//       background: #333;
//       color: #aaa;
//     `;
//   });

//   const contentDiv = document.getElementById("helperContent");
//   contentDiv.style.cssText = `
//     padding: 15px;
//     color: #e0e0e0;
//     line-height: 1.6;
//     font-size: 14px;
//     max-height: 500px;
//     overflow-y: auto;
//   `;

//   const downloadContainer = document.getElementById("downloadContainer");
//   downloadContainer.style.cssText = `
//     display: flex;
//     justify-content: flex-end;
//     margin-top: 10px;
//     padding: 0 15px;
//   `;

//   const styleSheet = document.createElement("style");
//   styleSheet.textContent = `
//     #helperContent::-webkit-scrollbar {
//       width: 8px;
//     }
//     #helperContent::-webkit-scrollbar-track {
//       background: #1a1a1a;
//     }
//     #helperContent::-webkit-scrollbar-thumb {
//       background: #444;
//       border-radius: 4px;
//     }
//     #helperContent::-webkit-scrollbar-thumb:hover {
//       background: #555;
//     }
//     .transcript-entry {
//       background-color: #1e1e1e;
//       border-radius: 8px;
//       padding: 12px;
//       margin-bottom: 12px;
//       border: 1px solid #333;
//       transition: background-color 0.3s ease;
//       position: relative;
//     }
//     .transcript-entry:hover {
//       background-color: #2a2a2a;
//     }
//     .transcript-text-container {
//       position: relative;
//       width: 100%;
//     }
//     .transcript-text {
//       display: block;
//       width: 100%;
//       box-sizing: border-box;
//       background: #2a2a2a;
//       border: 1px solid #444;
//       border-radius: 6px;
//       padding: 8px 30px 8px 8px;
//       margin-bottom: 10px;
//       color: #e0e0e0;
//       line-height: 1.5;
//       max-height: 150px;
//       overflow-y: auto;
//       resize: none;
//       word-wrap: break-word;
//     }
//     .edit-icon {
//       position: absolute;
//       top: 8px;
//       right: 8px;
//       cursor: pointer;
//       color: #666;
//       transition: color 0.3s ease;
//       width: 18px;
//       height: 18px;
//     }
//     .edit-icon:hover {
//       color: #fff;
//     }
//     .edit-submit-btn {
//       background: linear-gradient(to right, #2a2a2a, #1a1a1a);
//       color: #e0e0e0;
//       border: 1px solid #333;
//       padding: 6px 12px;
//       border-radius: 5px;
//       font-weight: 500;
//       font-size: 13px;
//       text-transform: uppercase;
//       letter-spacing: 0.5px;
//       transition: all 0.3s ease;
//       outline: none;
//       box-shadow: 0 2px 4px rgba(0,0,0,0.2);
//       margin-top: 10px;
//     }
//     .edit-submit-btn:hover {
//       background: linear-gradient(to right, #3a3a3a, #2a2a2a);
//       box-shadow: 0 3px 6px rgba(0,0,0,0.3);
//       transform: translateY(-1px);
//     }
//     .edit-submit-btn.hidden {
//       display: none;
//     }
//     .elegant-btn {
//       background: linear-gradient(to right, #2a2a2a, #1a1a1a);
//       color: #e0e0e0;
//       border: 1px solid #333;
//       padding: 8px 15px;
//       border-radius: 6px;
//       font-weight: 500;
//       text-transform: uppercase;
//       letter-spacing: 0.5px;
//       transition: all 0.3s ease;
//       outline: none;
//       box-shadow: 0 2px 5px rgba(0,0,0,0.2);
//     }
//     .elegant-btn:hover {
//       background: linear-gradient(to right, #3a3a3a, #2a2a2a);
//       box-shadow: 0 3px 7px rgba(0,0,0,0.3);
//       transform: translateY(-1px);
//     }
//     .answer-section {
//       margin-top: 10px;
//       display: flex;
//       flex-direction: column;
//       gap: 5px;
//     }
//     .answer-content {
//       white-space: pre-wrap;
//       word-wrap: break-word;
//       background: #2a2a2a;
//       border: 1px solid #444;
//       border-radius: 6px;
//       padding: 8px;
//       margin: 0;
//       color: #e0e0e0;
//       font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
//       font-size: 14px;
//       line-height: 1.6;
//       max-height: 200px;
//       overflow-y: auto;
//     }
//     .answer-content::-webkit-scrollbar {
//       width: 6px;
//     }
//     .answer-content::-webkit-scrollbar-track {
//       background: #2a2a2a;
//     }
//     .answer-content::-webkit-scrollbar-thumb {
//       background: #444;
//       border-radius: 3px;
//     }
//     .answer-content::-webkit-scrollbar-thumb:hover {
//       background: #555;
//     }
//   `;
//   document.head.appendChild(styleSheet);

//   let isDragging = false;
//   let currentX = 20,
//     currentY = 20,
//     initialX,
//     initialY;

//   header.addEventListener("mousedown", (e) => {
//     isDragging = true;
//     initialX = e.clientX - currentX;
//     initialY = e.clientY - currentY;
//     header.style.cursor = "grabbing";
//   });

//   document.addEventListener("mousemove", (e) => {
//     if (isDragging) {
//       e.preventDefault();
//       currentX = e.clientX - initialX;
//       currentY = e.clientY - initialY;
//       helperWindow.style.left = `${currentX}px`;
//       helperWindow.style.top = `${currentY}px`;
//     }
//   });

//   document.addEventListener("mouseup", () => {
//     isDragging = false;
//     header.style.cursor = "grab";
//   });

//   minimizeBtn.addEventListener("click", () => {
//     const currentHeight = contentDiv.style.height;
//     if (currentHeight === "0px") {
//       contentDiv.style.height = "auto";
//       contentDiv.style.padding = "15px";
//       minimizeBtn.textContent = "−";
//     } else {
//       contentDiv.style.height = "0px";
//       contentDiv.style.padding = "0 15px";
//       minimizeBtn.textContent = "+";
//     }
//   });

//   closeBtn.addEventListener("click", () => {
//     helperWindow.style.opacity = "0";
//     setTimeout(() => helperWindow.remove(), 300);
//   });

//   const downloadButton = document.getElementById("downloadTranscripts");
//   downloadButton.addEventListener("click", downloadSessionTranscripts);

//   helperWindow.style.left = `${currentX}px`;
//   helperWindow.style.top = `${currentY}px`;
//   helperWindow.style.opacity = "0";
//   setTimeout(() => {
//     helperWindow.style.opacity = "1";
//     helperWindow.style.transition = "opacity 0.5s ease, transform 0.3s ease";
//     helperWindow.style.transform = "translateY(0)";
//   }, 100);

//   return helperWindow;
// }

// function createTranscriptEntry(transcript, answer) {
//   const entryDiv = document.createElement("div");
//   entryDiv.className = "transcript-entry";

//   const transcriptSection = document.createElement("div");
//   transcriptSection.innerHTML = `
//     <div class="transcript-text-container">
//       <div class="transcript-text" readonly>${transcript}</div>
//       <svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
//         <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
//         <path d="m15 5 4 4"/>
//       </svg>
//     </div>
//     <button class="edit-submit-btn hidden">Submit Edit</button>
//   `;

//   const answerSection = document.createElement("div");
//   answerSection.className = "answer-section";
//   const answerLabel = document.createElement("strong");
//   answerLabel.textContent = "Answer: ";
//   const answerContent = document.createElement("pre");
//   answerContent.className = "answer-content";
//   const cleanAnswer = answer.replace(/^Response:\s*/i, '');
//   answerContent.textContent = cleanAnswer;

//   answerSection.appendChild(answerLabel);
//   answerSection.appendChild(answerContent);

//   entryDiv.appendChild(transcriptSection);
//   entryDiv.appendChild(answerSection);

//   const editIcon = entryDiv.querySelector(".edit-icon");
//   const transcriptTextDiv = entryDiv.querySelector(".transcript-text");
//   const submitBtn = entryDiv.querySelector(".edit-submit-btn");

//   editIcon.addEventListener("click", () => {
//     transcriptTextDiv.contentEditable = "true";
//     transcriptTextDiv.focus();
//     submitBtn.classList.remove("hidden");
//     transcriptTextDiv.style.border = "1px solid #4a8cb5";
//   });

//   submitBtn.addEventListener("click", async () => {
//     const editedTranscript = transcriptTextDiv.textContent.trim();
//     const newAnswer = await generateAnswer(editedTranscript);
//     const cleanNewAnswer = newAnswer.replace(/^Response:\s*/i, '');
//     answerContent.textContent = cleanNewAnswer;

//     const index = sessionTranscripts.findIndex(entry => entry.transcript === transcript);
//     if (index !== -1) {
//       sessionTranscripts[index] = {
//         transcript: editedTranscript,
//         answer: newAnswer
//       };
//     }

//     transcriptTextDiv.contentEditable = "false";
//     submitBtn.classList.add("hidden");
//     transcriptTextDiv.style.border = "1px solid #444";
//   });

//   return entryDiv;
// }

// function updateTranscriptDisplay() {
//   const transcriptContainer = document.getElementById("transcriptContainer");
//   transcriptContainer.innerHTML = "";
//   sessionTranscripts.forEach(entry => {
//     const entryDiv = createTranscriptEntry(entry.transcript, entry.answer);
//     transcriptContainer.appendChild(entryDiv);
//   });
// }

// function downloadSessionTranscripts() {
//   const transcriptText = sessionTranscripts.map((entry, index) =>
//     `Entry ${index + 1}:\nTranscript: ${entry.transcript}\nAnswer: ${entry.answer}\n\n`
//   ).join('');
//   const blob = new Blob([transcriptText], { type: 'text/plain' });
//   const url = URL.createObjectURL(blob);
//   const a = document.createElement('a');
//   a.href = url;
//   a.download = `WingmanAssistant_Transcripts_${new Date().toISOString().replace(/:/g, '-')}.txt`;
//   a.click();
//   URL.revokeObjectURL(url);
// }

// function showHelperWindow() {
//   createHelperWindow();
// }

// chrome.runtime.onMessage.addListener(async (message) => {
//   const contentDiv = document.getElementById("helperContent");

//   if (message.action === "showHelperWindow") {
//     showHelperWindow();
//   }

//   if (message.action === "displayTranscript") {
//     if (!contentDiv) {
//       showHelperWindow();
//     }
//     const answer = await generateAnswer(message.transcript);
//     sessionTranscripts.push({
//       transcript: message.transcript,
//       answer: answer
//     });
//     updateTranscriptDisplay();
//   } else if (message.action === "displayPresentation") {
//     if (!contentDiv) {
//       showHelperWindow();
//     }
//     const div = document.getElementById("helperContent");
//     div.innerText = message.data;
//     div.style.opacity = "0";
//     setTimeout(() => {
//       div.style.opacity = "1";
//       div.style.transition = "opacity 0.3s ease";
//     }, 50);
//   }
// });

// function generateAnswer(question) {
//   const apiKey = "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";
//   const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
//   return new Promise((resolve) => {
//     chrome.storage.local.get(["notes"], async (result) => {
//       const notes = result.notes || "No notes uploaded.";
//       try {
//         const response = await fetch(apiUrl, {
//           method: "POST",
//           headers: {
//             "Content-Type": "application/json",
//             Authorization: `Bearer ${apiKey}`,
//           },
//           body: JSON.stringify({
//             model: "llama-3.3-70b-versatile",
//             messages: [
//               {
//                 role: "system",
//                 content:
//                   "You are an AI assistant helping a candidate prepare for technical interviews. Provide precise, well-structured, and concise answers (≤250 words) that directly address the interview question. Keep responses clear, to the point, and professional, ensuring they effectively aid in interview preparation.",
//               },
//               {
//                 role: "user",
//                 content: question,
//               },
//             ],
//           }),
//         });
//         const data = await response.json();
//         if (data.choices && data.choices.length > 0)
//           resolve(`Response: ${data.choices[0].message.content}`);
//         else resolve("Error: No response from AI.");
//       } catch (error) {
//         console.error("Error fetching AI response:", error);
//         resolve("Error: Unable to fetch answer.");
//       }
//     });
//   });
// }

// ///////////////////////////////////////////////////////////////////////////////////////
let sessionTranscripts = [];
let currentTranscript = { transcript: "", answer: "No response required." };
let userHasScrolled = false;

function createHelperWindow() {
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
      <div id="downloadContainer">
        <button id="downloadTranscripts" class="elegant-btn">Download Transcripts</button>
      </div>
    </div>
  `;
  helperWindow.style.cssText = `
    position: fixed;
    z-index: 10000;
    width: 450px;
    background: #121212;
    color: #e0e0e0;
    border: 1px solid #333;
    border-radius: 12px;
    box-shadow: 0 10px 25px rgba(0,0,0,0.6), 0 0 1px rgba(255,255,255,0.1);
    font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
    overflow: hidden;
    transition: all 0.3s ease;
  `;
  document.body.appendChild(helperWindow);

  const header = document.getElementById("helperHeader");
  header.style.cssText = `
    cursor: move;
    padding: 12px 15px;
    background: linear-gradient(to bottom, #1f1f1f, #161616);
    border-bottom: 1px solid #333;
    display: flex;
    justify-content: space-between;
    align-items: center;
  `;

  const title = header.querySelector(".title");
  title.style.cssText = `
    font-weight: 600;
    letter-spacing: 0.5px;
    font-size: 15px;
    color: #ffd700;
    text-shadow: 0 1px 2px rgba(0,0,0,0.3);
  `;

  const controls = header.querySelector(".controls");
  controls.style.cssText = `
    display: flex;
    gap: 10px;
  `;

  const minimizeBtn = controls.querySelector(".minimize");
  const closeBtn = controls.querySelector(".close");

  const controlButtons = controls.querySelectorAll("span");
  controlButtons.forEach((button) => {
    button.style.cssText = `
      display: inline-block;
      width: 18px;
      height: 18px;
      text-align: center;
      line-height: 18px;
      border-radius: 50%;
      font-size: 14px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: #333;
      color: #aaa;
    `;
  });

  const contentDiv = document.getElementById("helperContent");
  contentDiv.style.cssText = `
    padding: 15px;
    color: #e0e0e0;
    line-height: 1.6;
    font-size: 14px;
    max-height: 500px;
    overflow-y: auto;
  `;

  const downloadContainer = document.getElementById("downloadContainer");
  downloadContainer.style.cssText = `
    display: flex;
    justify-content: flex-end;
    margin-top: 10px;
    padding: 0 15px;
  `;

  const styleSheet = document.createElement("style");
  styleSheet.textContent = `
    #helperContent::-webkit-scrollbar {
      width: 8px;
    }
    #helperContent::-webkit-scrollbar-track {
      background: #1a1a1a;
    }
    #helperContent::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 4px;
    }
    #helperContent::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
    .transcript-entry {
      background-color: #1e1e1e;
      border-radius: 8px;
      padding: 12px;
      margin-bottom: 12px;
      border: 1px solid #333;
      transition: background-color 0.3s ease;
      position: relative;
    }
    .transcript-entry:hover {
      background-color: #2a2a2a;
    }
    .transcript-text-container {
      position: relative;
      width: 100%;
    }
    .transcript-text {
      display: block;
      width: 100%;
      box-sizing: border-box;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 8px 50px 8px 8px;
      margin-bottom: 10px;
      color: #e0e0e0;
      line-height: 1.5;
      max-height: 150px;
      overflow-y: auto;
      resize: none;
      word-wrap: break-word;
      position: relative;
    }
    .transcript-text.loading::after {
      content: '';
      position: absolute;
      bottom: 8px;
      left: 8px;
      width: 70%;
      height: 14px;
      background: linear-gradient(to right, #333, #555, #333);
      filter: blur(2px);
      border-radius: 2px;
      animation: skeletonPulse 1.5s infinite ease-in-out;
    }
    @keyframes skeletonPulse {
      0% { opacity: 0.4; }
      50% { opacity: 0.7; }
      100% { opacity: 0.4; }
    }
    .edit-icon, .submit-icon {
      position: absolute;
      top: 8px;
      cursor: pointer;
      color: #666;
      transition: color 0.3s ease;
      width: 18px;
      height: 18px;
    }
    .edit-icon {
      right: 30px;
    }
    .submit-icon {
      right: 8px;
    }
    .edit-icon:hover, .submit-icon:hover {
      color: #fff;
    }
    .edit-submit-btn {
      background: linear-gradient(to right, #2a2a2a, #1a1a1a);
      color: #e0e0e0;
      border: 1px solid #333;
      padding: 6px 12px;
      border-radius: 5px;
      font-weight: 500;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      outline: none;
      box-shadow: 0 2px 4px rgba(0,0,0,0.2);
      margin-top: 10px;
    }
    .edit-submit-btn:hover {
      background: linear-gradient(to right, #3a3a3a, #2a2a2a);
      box-shadow: 0 3px 6px rgba(0,0,0,0.3);
      transform: translateY(-1px);
    }
    .edit-submit-btn.hidden {
      display: none;
    }
    .elegant-btn {
      background: linear-gradient(to right, #2a2a2a, #1a1a1a);
      color: #e0e0e0;
      border: 1px solid #333;
      padding: 8px 15px;
      border-radius: 6px;
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.5px;
      transition: all 0.3s ease;
      outline: none;
      box-shadow: 0 2px 5px rgba(0,0,0,0.2);
    }
    .elegant-btn:hover {
      background: linear-gradient(to right, #3a3a3a, #2a2a2a);
      box-shadow: 0 3px 7px rgba(0,0,0,0.3);
      transform: translateY(-1px);
    }
    .answer-section {
      margin-top: 10px;
      display: flex;
      flex-direction: column;
      gap: 5px;
    }
    .answer-content {
      white-space: pre-wrap;
      word-wrap: break-word;
      background: #2a2a2a;
      border: 1px solid #444;
      border-radius: 6px;
      padding: 8px;
      margin: 0;
      color: #e0e0e0;
      font-family: 'Inter', 'Segoe UI', Arial, sans-serif;
      font-size: 14px;
      line-height: 1.6;
      max-height: 200px;
      overflow-y: auto;
    }
    .answer-content::-webkit-scrollbar {
      width: 6px;
    }
    .answer-content::-webkit-scrollbar-track {
      background: #2a2a2a;
    }
    .answer-content::-webkit-scrollbar-thumb {
      background: #444;
      border-radius: 3px;
    }
    .answer-content::-webkit-scrollbar-thumb:hover {
      background: #555;
    }
  `;
  document.head.appendChild(styleSheet);

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

  minimizeBtn.addEventListener("click", () => {
    const currentHeight = contentDiv.style.height;
    if (currentHeight === "0px") {
      contentDiv.style.height = "auto";
      contentDiv.style.padding = "15px";
      minimizeBtn.textContent = "−";
    } else {
      contentDiv.style.height = "0px";
      contentDiv.style.padding = "0 15px";
      minimizeBtn.textContent = "+";
    }
  });

  closeBtn.addEventListener("click", () => {
    helperWindow.style.opacity = "0";
    setTimeout(() => helperWindow.remove(), 300);
  });

  const downloadButton = document.getElementById("downloadTranscripts");
  downloadButton.addEventListener("click", downloadSessionTranscripts);

  contentDiv.addEventListener("scroll", () => {
    const isNearBottom = contentDiv.scrollHeight - contentDiv.scrollTop - contentDiv.clientHeight < 50;
    userHasScrolled = !isNearBottom;
  });

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

function createTranscriptEntry(transcript, answer, isCurrent = false) {
  const entryDiv = document.createElement("div");
  entryDiv.className = "transcript-entry";

  const transcriptSection = document.createElement("div");
  transcriptSection.innerHTML = `
    <div class="transcript-text-container">
      <div class="transcript-text ${isCurrent ? 'loading' : ''}" readonly>${transcript}</div>
      <svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>
      ${isCurrent ? `
      <svg class="submit-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"/>
        <path d="m12 5 7 7-7 7"/>
      </svg>` : ''}
    </div>
    <button class="edit-submit-btn hidden">Submit</button>
  `;

  const answerSection = document.createElement("div");
  answerSection.className = "answer-section";
  const answerLabel = document.createElement("strong");
  answerLabel.textContent = "Answer: ";
  const answerContent = document.createElement("pre");
  answerContent.className = "answer-content";
  const cleanAnswer = answer.replace(/^Response:\s*/i, '');
  answerContent.textContent = cleanAnswer === "No response required." ? "—" : cleanAnswer;

  answerSection.appendChild(answerLabel);
  answerSection.appendChild(answerContent);

  entryDiv.appendChild(transcriptSection);
  entryDiv.appendChild(answerSection);

  const editIcon = entryDiv.querySelector(".edit-icon");
  const submitIcon = entryDiv.querySelector(".submit-icon");
  const transcriptTextDiv = entryDiv.querySelector(".transcript-text");
  const submitBtn = entryDiv.querySelector(".edit-submit-btn");

  editIcon.addEventListener("click", () => {
    transcriptTextDiv.contentEditable = "true";
    transcriptTextDiv.focus();
    submitBtn.classList.remove("hidden");
    transcriptTextDiv.style.border = "1px solid #4a8cb5";
  });

  submitBtn.addEventListener("click", async () => {
    const editedTranscript = transcriptTextDiv.textContent.trim();
    const newAnswer = await generateAnswer(editedTranscript);
    const cleanNewAnswer = newAnswer.replace(/^Response:\s*/i, '');
    answerContent.textContent = cleanNewAnswer;

    const index = sessionTranscripts.findIndex(entry => entry.transcript === transcript);
    if (index !== -1) {
      sessionTranscripts[index] = {
        transcript: editedTranscript,
        answer: newAnswer
      };
    } else if (currentTranscript.transcript === transcript) {
      currentTranscript = { transcript: editedTranscript, answer: newAnswer };
    }

    transcriptTextDiv.contentEditable = "false";
    submitBtn.classList.add("hidden");
    transcriptTextDiv.style.border = "1px solid #444";
    updateTranscriptDisplay();
  });

  if (submitIcon) {
    submitIcon.addEventListener("click", async () => {
      const finalTranscript = transcriptTextDiv.textContent.trim();
      const answer = await generateAnswer(finalTranscript);
      currentTranscript.transcript = finalTranscript;
      currentTranscript.answer = answer;
      sessionTranscripts.push({ ...currentTranscript });
      currentTranscript = { transcript: "", answer: "No response required." };
      updateTranscriptDisplay();
    });
  }

  return entryDiv;
}

function updateTranscriptDisplay() {
  const transcriptContainer = document.getElementById("transcriptContainer");
  if (!transcriptContainer) return;

  transcriptContainer.innerHTML = "";
  sessionTranscripts.forEach(entry => {
    const entryDiv = createTranscriptEntry(entry.transcript, entry.answer);
    transcriptContainer.appendChild(entryDiv);
  });

  if (currentTranscript.transcript) {
    const currentEntryDiv = createTranscriptEntry(currentTranscript.transcript, currentTranscript.answer, true);
    transcriptContainer.appendChild(currentEntryDiv);
  }

  const contentDiv = document.getElementById("helperContent");
  if (contentDiv && !userHasScrolled) {
    contentDiv.scrollTop = contentDiv.scrollHeight;
  }
}

function downloadSessionTranscripts() {
  const transcriptText = sessionTranscripts.map((entry, index) =>
    `Entry ${index + 1}:\nTranscript: ${entry.transcript}\nAnswer: ${entry.answer}\n\n`
  ).join('');
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
      showHelperWindow();
    }

    const transcript = message.transcript;

    // Always append transcript to currentTranscript, regardless of isFinal
    currentTranscript.transcript = currentTranscript.transcript
      ? `${currentTranscript.transcript} ${transcript}`
      : transcript;

    if (message.isFinal) {
      // Finalize and send to Grok only when explicitly marked as final
      const answer = await generateAnswer(currentTranscript.transcript);
      currentTranscript.answer = answer;
      sessionTranscripts.push({ ...currentTranscript });
      currentTranscript = { transcript: "", answer: "No response required." };
    }

    updateTranscriptDisplay();
  } else if (message.action === "displayPresentation") {
    if (!contentDiv) {
      showHelperWindow();
    }
    const div = document.getElementById("helperContent");
    div.innerText = message.data;
    div.style.opacity = "0";
    setTimeout(() => {
      div.style.opacity = "1";
      div.style.transition = "opacity 0.3s ease";
    }, 50);
  }
});

// function generateAnswer(question) {
//     const apiKey = "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";
//     const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
//     return new Promise((resolve) => {
//         chrome.storage.local.get(["notes"], async (result) => {
//             const notes = result.notes || "No notes uploaded.";
//             try {
//                 const response = await fetch(apiUrl, {
//                     method: "POST",
//                     headers: {
//                         "Content-Type": "application/json",
//                         Authorization: `Bearer ${apiKey}`,
//                     },
//                     body: JSON.stringify({
//                         model: "llama-3.3-70b-versatile",
//                         messages: [
//                             {
//                                 role: "system",
//                                 content:
//                                     "You are an AI assistant helping a candidate prepare for technical interviews. Provide precise, well-structured, and concise answers (≤250 words) that directly address the interview question. Keep responses clear, to-the-point, and professional, ensuring they effectively aid in interview preparation.",
//                             },
//                             {
//                                 role: "user",
//                                 content: question,
//                             },
//                         ],
//                     }),
//                 });
//                 const data = await response.json();
//                 if (data.choices && data.choices.length > 0)
//                     resolve(`Response: ${data.choices[0].message.content}`);
//                 else resolve("Error: No response from AI.");
//             } catch (error) {
//                 console.error("Error fetching AI response:", error);
//                 resolve("Error: Unable to fetch answer.");
//             }
//         });
//     });
// }

function generateAnswer(question) {
  const apiKey = "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";
  const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
  const model = "llama-3.3-70b-versatile";

  return new Promise((resolve) => {
    // Fetch notes from chrome.storage.local
    chrome.storage.local.get(["notes"], async (result) => {
      const notes = result.notes || "No contextual notes available.";

      // System prompt tailored for all meeting types
      const systemPrompt = `
                You are an AI assistant designed to assist users in diverse meeting contexts, including technical interviews, formal business meetings, presentations, brainstorming sessions, and casual discussions. Your goal is to provide precise, well-structured, and concise answers (≤250 words) that directly address the user's question or request. Use the following guidelines:
                - For technical questions (e.g., DSA, coding, system design), offer clear, professional, and accurate solutions with examples where applicable.
                - For business/formal meetings, provide strategic, actionable, and polished responses suitable for professional settings.
                - For presentations, deliver succinct, audience-friendly explanations or summaries.
                - For general queries, adapt to the context and provide helpful, relevant insights.
                - If relevant, incorporate information from the user's uploaded notes: "${notes}"
                Keep responses clear, to-the-point, and tailored to assist the user effectively in real-time meeting scenarios.
            `;

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: model,
            messages: [
              {
                role: "system",
                content: systemPrompt,
              },
              {
                role: "user",
                content: question,
              },
            ],
            max_tokens: 300, // Ensures concise responses (~250 words)
            temperature: 0.7, // Balanced creativity and accuracy
          }),
        });

        if (!response.ok) {
          throw new Error(`HTTP error! Status: ${response.status}`);
        }

        const data = await response.json();

        if (data.choices && data.choices.length > 0) {
          resolve(data.choices[0].message.content.trim());
        } else {
          resolve("Error: No valid response from AI.");
        }
      } catch (error) {
        console.error("Failed to fetch AI response:", error.message || error);
        resolve("Error: Unable to fetch answer at this time.");
      }
    });
  });
}