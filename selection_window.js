const canvas = document.getElementById("selectionCanvas");
const ctx = canvas.getContext("2d");
const selectionRect = document.getElementById("selectionRect");
const confirmButton = document.getElementById("confirmButton");
const resultContainer = document.getElementById("resultContainer");
const capturedTextElement = document.getElementById("capturedText");
const aiResponseElement = document.getElementById("aiResponse");
const loadingIndicator = document.getElementById("loadingIndicator");
const closeResultButton = document.getElementById("closeResultButton");
const copyButton = document.getElementById("copyButton");
const editButton = document.querySelector(".edit-btn");
const submitButton = document.querySelector(".submit-btn");

let startX, startY, endX, endY;
let isDrawing = false;
let sessionTranscripts = [];

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

// Capture the screen snapshot
chrome.runtime.sendMessage({ action: "captureScreen" }, async (response) => {
    if (response && response.streamId) {
        const stream = await navigator.mediaDevices.getUserMedia({
            video: {
                mandatory: {
                    chromeMediaSource: "desktop",
                    chromeMediaSourceId: response.streamId,
                },
            },
        });
        const video = document.createElement("video");
        video.srcObject = stream;
        await video.play();
        ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
        stream.getTracks().forEach((track) => track.stop());
    }
});

// Draw selection box
canvas.addEventListener("mousedown", (e) => {
    startX = e.clientX;
    startY = e.clientY;
    isDrawing = true;
});

canvas.addEventListener("mousemove", (e) => {
    if (!isDrawing) return;
    endX = e.clientX;
    endY = e.clientY;

    const width = endX - startX;
    const height = endY - startY;
    selectionRect.style.left = `${startX}px`;
    selectionRect.style.top = `${startY}px`;
    selectionRect.style.width = `${width}px`;
    selectionRect.style.height = `${height}px`;
    selectionRect.style.display = "block";
});

canvas.addEventListener("mouseup", () => {
    isDrawing = false;
});

// Add escape key to cancel
document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
        chrome.runtime.sendMessage({
            action: "closeSelectionWindow",
            windowId: chrome.windows.WINDOW_ID_CURRENT,
        });
    }
});

// Confirm and do OCR
confirmButton.addEventListener("click", async () => {
    if (startX && endX && startY && endY) {
        const width = endX - startX;
        const height = endY - startY;

        if (width < 10 || height < 10) {
            showToast("Selection too small. Please select a larger area.");
            return;
        }

        showLoading("Analyzing screen...");

        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(canvas, startX, startY, width, height, 0, 0, width, height);
        const imageData = tempCanvas.toDataURL("image/png");

        // OCR logic
        const workerPath = chrome.runtime.getURL("lib/worker.min.js");
        const langPath = chrome.runtime.getURL("lib/tessdata/");
        const corePath = chrome.runtime.getURL("lib/tesseract-core.wasm.js");

        try {
            const worker = await Tesseract.createWorker({
                workerPath,
                langPath,
                corePath,
                workerBlobURL: false,
                logger: (m) => console.log("Tesseract Progress:", m),
            });

            await worker.load();
            await worker.loadLanguage("eng");
            await worker.initialize("eng");

            const { data: { text } } = await worker.recognize(imageData);
            await worker.terminate();

            if (!text || text.trim() === "") {
                showToast("No text detected in the selected area.");
                hideLoading();
                return;
            }

            // Display the captured text
            capturedTextElement.textContent = text;

            // Generate answer from Groq
            updateLoadingText("Generating answer...");
            const answer = await generateAnswer(text);

            // Display the AI response
            aiResponseElement.textContent = answer;

            // Show the result container with animation
            resultContainer.style.display = "block";
            // Trigger reflow
            void resultContainer.offsetWidth;
            resultContainer.classList.add("show");

            hideLoading();

            // Store in session transcripts
            sessionTranscripts.push({
                transcript: text,
                answer: answer
            });

            // Send to background for history
            chrome.runtime.sendMessage({
                action: "displayTranscript",
                transcript: text,
                answer: answer,
                isFinal: true
            });

        } catch (err) {
            console.error("OCR Error:", err);
            showToast("Error analyzing screen: " + err.message);
            hideLoading();
        }
    } else {
        showToast("Please make a selection first.");
    }
});


// Edit functionality
editButton.addEventListener("click", () => {
    capturedTextElement.contentEditable = "true";
    capturedTextElement.classList.add("editable");
    capturedTextElement.focus();
    submitButton.style.display = "block";
});

submitButton.addEventListener("click", async () => {
    const editedText = capturedTextElement.textContent.trim();
    if (!editedText) {
        showToast("Text cannot be empty");
        return;
    }

    showLoading("Generating new answer...");
    const newAnswer = await generateAnswer(editedText);

    aiResponseElement.textContent = newAnswer;
    capturedTextElement.contentEditable = "false";
    capturedTextElement.classList.remove("editable");
    submitButton.style.display = "none";

    // Update session transcripts
    sessionTranscripts[sessionTranscripts.length - 1] = {
        transcript: editedText,
        answer: newAnswer
    };

    // Update history
    chrome.runtime.sendMessage({
        action: "displayTranscript",
        transcript: editedText,
        answer: newAnswer,
        isFinal: true
    });

    hideLoading();
});

// Generate answer using Groq API
function generateAnswer(question) {
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
                        messages: [
                            {
                                role: "system",
                                content: `You are an AI assistant for technical interview preparation. Provide *direct, clean, and precise* answers *under 200 words* without unnecessary details, preambles, or disclaimers. If notes are available, extract *only the key information* relevant to the user's question—do not mention the notes explicitly. If notes are unavailable, generate a *well-structured* response based on your knowledge, ensuring clarity and relevance.

${notes ? `Notes:\n${notes}` : ""}`
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
                if (data.choices && data.choices.length > 0) {
                    resolve(data.choices[0].message.content);
                } else {
                    resolve("Error: No response from AI.");
                }
            } catch (error) {
                console.error("Error fetching AI response:", error);
                resolve("Error: Unable to fetch answer.");
            }
        });
    });
}

// Close result view and return to selection
closeResultButton.addEventListener("click", () => {
    resultContainer.classList.remove("show");
    setTimeout(() => {
        resultContainer.style.display = "none";
        selectionRect.style.display = "none";
        startX = startY = endX = endY = null;
    }, 400); // Match the transition time
});

// Copy AI response to clipboard
copyButton.addEventListener("click", () => {
    const textToCopy = aiResponseElement.textContent;
    navigator.clipboard.writeText(textToCopy).then(() => {
        showToast("Response copied to clipboard!");
    }).catch(err => {
        console.error('Could not copy text: ', err);
        showToast("Failed to copy to clipboard");
    });
});

// Helper functions for UI feedback
function showToast(message) {
    const toast = document.getElementById("toast");
    toast.textContent = message;
    toast.classList.add("show");
    setTimeout(() => {
        toast.classList.remove("show");
    }, 3000);
}

function showLoading(text) {
    loadingIndicator.style.display = "flex";
    document.getElementById("loadingText").textContent = text;
    // Trigger reflow
    void loadingIndicator.offsetWidth;
    loadingIndicator.classList.add("show");
}

function updateLoadingText(text) {
    document.getElementById("loadingText").textContent = text;
}

function hideLoading() {
    loadingIndicator.classList.remove("show");
    setTimeout(() => {
        loadingIndicator.style.display = "none";
    }, 300); // Match the transition time
}