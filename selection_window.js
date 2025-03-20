// selection_window.js
const canvas = document.getElementById("selectionCanvas");
const ctx = canvas.getContext("2d");
const selectionRect = document.getElementById("selectionRect");
const confirmButton = document.getElementById("confirmButton");
const cancelButton = document.getElementById("cancelButton");

let startX, startY, endX, endY;
let isDrawing = false;

canvas.width = window.innerWidth;
canvas.height = window.innerHeight;

chrome.runtime.sendMessage(
    { action: "captureScreen" },
    async (response) => {
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
    }
);

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

confirmButton.addEventListener("click", () => {
    if (startX && endX && startY && endY) {
        const width = endX - startX;
        const height = endY - startY;
        const tempCanvas = document.createElement("canvas");
        tempCanvas.width = width;
        tempCanvas.height = height;
        const tempCtx = tempCanvas.getContext("2d");
        tempCtx.drawImage(
            canvas,
            startX,
            startY,
            width,
            height,
            0,
            0,
            width,
            height
        );
        const imageData = tempCanvas.toDataURL("image/png");

        chrome.runtime.sendMessage({
            action: "screenSelected",
            imageData: imageData,
            windowId: chrome.windows.WINDOW_ID_CURRENT,
        });
    }
});

cancelButton.addEventListener("click", () => {
    chrome.runtime.sendMessage({
        action: "closeSelectionWindow",
        windowId: chrome.windows.WINDOW_ID_CURRENT,
    });
});