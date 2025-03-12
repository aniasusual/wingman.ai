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
  const entryDiv = document.createElement("div");
  entryDiv.className = "transcript-entry";

  const transcriptSection = document.createElement("div");
  transcriptSection.innerHTML = `
    <div class="transcript-text-container">
      <div class="transcript-text ${
        isCurrent ? "loading" : ""
      }" readonly>${transcript}</div>
      <svg class="edit-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M17 3a2.85 2.83 0 1 1 4 4L7.5 20.5 2 22l1.5-5.5Z"/>
        <path d="m15 5 4 4"/>
      </svg>
      ${
        isCurrent
          ? `
      <svg class="submit-icon" xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <path d="M5 12h14"/>
        <path d="m12 5 7 7-7 7"/>
      </svg>`
          : ""
      }
    </div>
    <button class="edit-submit-btn hidden">Submit</button>
  `;

  const answerSection = document.createElement("div");
  answerSection.innerHTML = `<strong>Answer: </strong><pre class="answer-content">${
    answer.replace(/^Response:\s*/i, "") || "—"
  }</pre>`;

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
        `Entry ${index + 1}:\nTranscript: ${entry.transcript}\nAnswer: ${
          entry.answer
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
  const apiKey = "REDACTED_SECRET";
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
            messages: [
              {
                role: "system",
                content: `You are **Wingman, an AI assistant for virtual meetings, interviews, and professional discussions**, designed to provide **concise, engaging, and example-driven responses (under 200 words)**. Your goal is to **help users sound confident, knowledgeable, and prepared** in any professional setting.

### **Response Guidelines:**
- **Only respond if the user input is a valid question.** If it is not a question, do not generate any response—return absolutely nothing.
- **Always use a conversational tone that makes the response easy to read and repeat naturally.**  
  - **Use first-person phrasing** like:  
    - *"You can think of it as..."*  
    - *"Imagine..."*  
    - *"A good way to explain this is..."*  
    - *"Let me break it down with a simple story..."*  
  - Avoid dry, textbook-style explanations.
- **For technical questions:**  
  - Explain using **real-world analogies and stories** that make the concept easy to visualize.  
  - Provide **a simple, practical example** that the user can remember and use in a discussion.  
  - If applicable, **include a short, easy-to-understand code snippet.**
- **For non-technical meetings:**  
  - Keep responses aligned with the context of the discussion.  
  - Use **engaging, scenario-based explanations** relevant to the industry or business need.
- **Ensure clarity, confidence, and engagement**—the response should **impress** the listener.
- **Avoid generic or robotic phrasing**—make it sound natural and professional.
- **Always keep responses under 200 words** but ensure every word adds value—no fluff.
- **If a question isn’t covered in notes or transcripts**, generate a well-structured response based on knowledge, aligning with the user’s expertise.

### **Example Enhancements for Technical Questions:**
#### **Typical Abstract Answer (Too Dry)**  
*"Multithreading in Java allows concurrent execution of tasks, improving system efficiency. You can create threads using the Thread class or the Runnable interface."*  

#### **Conversational, Example-Driven Answer**  
*"Alright, imagine you're running a restaurant with only one chef. He takes one order, cooks it, serves it, then starts the next one—it’s slow. Now, what if you had multiple chefs? One handles the grill, another preps the salads, and another makes desserts. Suddenly, everything moves faster! That’s multithreading in Java—you create multiple 'chefs' (threads) to handle tasks at the same time, making programs more efficient.  

For example, in Java, you can create a new thread like this:  
\`\`\`java
class MyThread extends Thread {
    public void run() {
        System.out.println("Cooking order...");
    }
}
public class Main {
    public static void main(String[] args) {
        MyThread chef1 = new MyThread();
        chef1.start();
    }
}
\`\`\`
And just like that, Java starts handling tasks concurrently instead of waiting for one to finish before starting another!"*  

Your primary goal is to ensure that users leave meetings, interviews, or discussions sounding **highly competent, professional, and impressive**—with answers they can deliver naturally.`,
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
