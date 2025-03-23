const canvas = document.getElementById("selectionCanvas");
const ctx = canvas.getContext("2d");
const selectionRect = document.getElementById("selectionRect");
const confirmButton = document.getElementById("confirmButton");
const cancelButton = document.getElementById("cancelButton");

let startX, startY, endX, endY;
let isDrawing = false;

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
});

canvas.addEventListener("mouseup", () => {
    isDrawing = false;
});

// Confirm and do OCR
confirmButton.addEventListener("click", async () => {
    if (startX && endX && startY && endY) {
        const width = endX - startX;
        const height = endY - startY;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(canvas, startX, startY, width, height, 0, 0, width, height);
        const imageData = tempCanvas.toDataURL("image/png");

        // OCR logic integrated directly here
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

            console.log("Worker created successfully");
            await worker.load();
            await worker.loadLanguage("eng");
            await worker.initialize("eng");

            const { data: { text } } = await worker.recognize(imageData);
            console.log("Recognized text:", text);

            await worker.terminate();

            chrome.runtime.sendMessage({
                action: "displayTranscript",
                transcript: `Screen Search: ${text}`,
                isFinal: true,
                // Include windowId if needed
            });

            alert("Screen content analyzed:\n\n" + text);
        } catch (err) {
            console.error("OCR Error:", err);
            alert("Error analyzing screen.");
        }

        chrome.runtime.sendMessage({
            action: "closeSelectionWindow",
            windowId: chrome.windows.WINDOW_ID_CURRENT,
        });
    }
});

// Cancel selection
cancelButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({
        action: "closeSelectionWindow",
        windowId: chrome.windows.WINDOW_ID_CURRENT,
    });
});
