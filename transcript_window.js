let sessionTranscripts = [];
let currentTranscript = { transcript: "", answer: "No response required." };
let userHasScrolled = false;

const contentDiv = document.getElementById("helperContent");
const downloadButton = document.getElementById("downloadTranscripts");

downloadButton.addEventListener("click", downloadSessionTranscripts);

contentDiv.addEventListener("scroll", () => {
  const isNearBottom =
    contentDiv.scrollHeight - contentDiv.scrollTop - contentDiv.clientHeight <
    50;
  userHasScrolled = !isNearBottom;
});

function createTranscriptEntry(transcript, answer, isCurrent = false) {
  // CHANGED: Distinguish screen search entries
  const isScreenSearch = transcript.startsWith("Screen Search:");
  const entryDiv = document.createElement("div");
  entryDiv.className = "transcript-entry";
  entryDiv.style.backgroundColor = isScreenSearch ? "#25252c" : "#1e1e1e"; // Different color for screen search

  const displayTranscript = isScreenSearch
    ? transcript.replace("Screen Search: ", "")
    : transcript;

  const transcriptSection = document.createElement("div");
  transcriptSection.innerHTML = `
    <div class="transcript-text-container">
      <div class="transcript-text ${isCurrent ? "loading" : ""}" readonly>${isScreenSearch ? "Screen Search: " : ""
    }${displayTranscript}</div>
      <svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>
      <svg class="submit-icon hidden" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"/>
        <path d="m12 5 7 7-7 7"/>
      </svg>
    </div>
  `;

  const answerSection = document.createElement("div");
  answerSection.innerHTML = `<strong>Answer: </strong><pre class="answer-content">${answer.replace(/^Response:\s*/i, "") || "—"
    }</pre>`;

  entryDiv.appendChild(transcriptSection);
  entryDiv.appendChild(answerSection);

  const editIcon = entryDiv.querySelector(".edit-icon");
  const submitIcon = entryDiv.querySelector(".submit-icon");
  const transcriptTextDiv = entryDiv.querySelector(".transcript-text");

  editIcon.addEventListener("click", () => {
    transcriptTextDiv.contentEditable = "true";
    transcriptTextDiv.focus();
    submitIcon.classList.remove("hidden");
    transcriptTextDiv.style.border = "1px solid #4a8cb5";
  });

  submitIcon.addEventListener("click", async () => {
    const editedTranscript = transcriptTextDiv.textContent.trim();
    const newAnswer = await generateAnswer(editedTranscript);
    const cleanNewAnswer = newAnswer.replace(/^Response:\s*/i, "");
    answerSection.querySelector(".answer-content").textContent =
      cleanNewAnswer || "—";

    const index = sessionTranscripts.findIndex(
      (entry) => entry.transcript === transcript
    );
    if (index !== -1) {
      sessionTranscripts[index] = {
        transcript: editedTranscript,
        answer: newAnswer,
      };
    } else if (currentTranscript.transcript === transcript) {
      currentTranscript = { transcript: editedTranscript, answer: newAnswer };
    }

    transcriptTextDiv.contentEditable = "false";
    submitIcon.classList.add("hidden");
    transcriptTextDiv.style.border = "1px solid #444";
    updateTranscriptDisplay();
  });

  if (isCurrent) {
    submitIcon.classList.remove("hidden");
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
  transcriptContainer.innerHTML = "";
  sessionTranscripts.forEach((entry) => {
    const entryDiv = createTranscriptEntry(entry.transcript, entry.answer);
    transcriptContainer.appendChild(entryDiv);
  });
  if (currentTranscript.transcript) {
    const currentEntryDiv = createTranscriptEntry(
      currentTranscript.transcript,
      currentTranscript.answer,
      true
    );
    transcriptContainer.appendChild(currentEntryDiv);
  }
  if (!userHasScrolled) {
    contentDiv.scrollTop = contentDiv.scrollHeight;
  }
}

function downloadSessionTranscripts() {
  const transcriptText = sessionTranscripts
    .map(
      (entry, index) =>
        `Entry ${index + 1}:\nTranscript: ${entry.transcript}\nAnswer: ${entry.answer
        }\n\n`
    )
    .join("");
  const blob = new Blob([transcriptText], { type: "text/plain" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `WingmanAssistant_Transcripts_${new Date()
    .toISOString()
    .replace(/:/g, "-")}.txt`;
  a.click();
  URL.revokeObjectURL(url);
}

function generateAnswer(question) {
  // const apiKey = "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";
  console.log("question", question);
  const apiKey = "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";
  const apiUrl = "https://api.groq.com/openai/v1/chat/completions";
  return new Promise((resolve) => {
    chrome.storage.local.get(["notes"], async (result) => {
      const notes = result.notes || "No notes uploaded.";

      const transcriptContext =
        sessionTranscripts.length > 0
          ? sessionTranscripts
            .map((entry) => `Q: ${entry.transcript}\nA: ${entry.answer}`)
            .join("\n\n")
          : "";

      try {
        const response = await fetch(apiUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${apiKey}`,
          },
          body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            //             messages: [
            //               {
            //                 role: "system",
            //                 content: `You are an AI assistant for technical interview preparation. Provide *direct, clean, and precise* answers *under 200 words* without unnecessary details, preambles, or disclaimers. If notes are available, extract *only the key information* relevant to the user's question—do not mention the notes explicitly. If notes are unavailable, generate a *well-structured* response based on your knowledge, ensuring clarity and relevance.

            // ${notes ? `Notes:\n${notes}` : ""}`,
            //               },
            //               ...(transcriptContext
            //                 ? [
            //                     {
            //                       role: "system",
            //                       content: `Additional past conversation transcripts for reference:\n\n${transcriptContext}`,
            //                     },
            //                   ]
            //                 : []),
            //               {
            //                 role: "user",
            //                 content: question,
            //               },
            //             ],
            messages: [
              {
                role: "system",
                content: `You are an AI assistant ,assisting a candidate interviews a and video call meetings. Provide answers in *first person*, using *simple, clear English* that the candidate can directly speak out loud.

Your answers should be:
- *Clean, to the point
- Relevant to the question, without any fluff, unnecessary details, preambles, or disclaimers
- *Suitable for both technical and non-technical questions*
- Free from unnecessary intros like "according to the notes" or "based on your resume"

If notes are available, extract *only the key information* relevant to the user's question—do not mention the notes explicitly and speak *as if you are the candidate*.
If no notes are available, generate a well-structured, direct response based on your knowledge, ensuring clarity and relevance.

Always speak with confidence, clarity, and focus. No filler—just helpful, real answers. Also if necessary take some reference from the notes as well which I am attaching.
${notes ? `Notes:\n${notes}` : ""}`,
              },
              ...(transcriptContext
                ? [
                  {
                    role: "system",
                    content: `Additional past conversation transcripts for reference:\n\n${transcriptContext}`,
                  },
                ]
                : []),
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

chrome.runtime.onMessage.addListener(async (message) => {
  if (message.target !== "transcriptWindow") return;

  if (message.action === "displayTranscript") {
    currentTranscript.transcript = currentTranscript.transcript
      ? `${currentTranscript.transcript} ${message.transcript}`
      : message.transcript;

    if (message.isFinal) {
      const answer = await generateAnswer(currentTranscript.transcript);
      currentTranscript.answer = answer;
      sessionTranscripts.push({ ...currentTranscript });
      currentTranscript = { transcript: "", answer: "No response required." };
    }
    updateTranscriptDisplay();
  } else if (message.action === "displayPresentation") {
    contentDiv.innerText = message.data;
  }
});
