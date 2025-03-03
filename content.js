// content.js
// Create the draggable helper window (unchanged)
if (!document.getElementById("helperWindow")) {
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
        <div id="helperContent">Ready to assist...</div>
    `;
    helperWindow.style.cssText = `
        position: fixed;
        z-index: 10000;
        width: 300px;
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

    minimize.addEventListener("mouseover", () => (minimize.style.background = "#777"));
    minimize.addEventListener("mouseout", () => (minimize.style.background = "#555"));
    close.addEventListener("mouseover", () => (close.style.background = "#777"));
    close.addEventListener("mouseout", () => (close.style.background = "#555"));

    const contentDiv = document.getElementById("helperContent");
    contentDiv.style.cssText = `
        padding: 15px;
        color: #e0e0e0;
        line-height: 1.5;
        font-size: 13px;
        max-height: 300px;
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

    close.addEventListener("click", () => {
        helperWindow.style.opacity = "0";
        setTimeout(() => helperWindow.remove(), 300);
    });

    helperWindow.style.left = `${currentX}px`;
    helperWindow.style.top = `${currentY}px`;
    helperWindow.style.opacity = "0";
    setTimeout(() => {
        helperWindow.style.opacity = "1";
        helperWindow.style.transition = "opacity 0.5s ease, transform 0.3s ease";
        helperWindow.style.transform = "translateY(0)";
    }, 100);
}

chrome.runtime.onMessage.addListener(async (message) => {
    const contentDiv = document.getElementById("helperContent");
    if (message.action === "displayTranscript") {
        generateAnswer(message.transcript).then((answer) => {
            contentDiv.innerText = `Transcript: ${message.transcript}\nAnswer: ${answer}`;
            contentDiv.style.opacity = "0";
            setTimeout(() => {
                contentDiv.style.opacity = "1";
                contentDiv.style.transition = "opacity 0.3s ease";
            }, 50);
        });
    } else if (message.action === "displayPresentation") {
        contentDiv.innerText = message.data;
        contentDiv.style.opacity = "0";
        setTimeout(() => {
            contentDiv.style.opacity = "1";
            contentDiv.style.transition = "opacity 0.3s ease";
        }, 50);
    }
});

function generateAnswer(question) {
    return new Promise((resolve) => {
        chrome.storage.local.get(["notes"], (result) => {
            const notes = result.notes || "No notes uploaded.";
            resolve(`Response: Based on your notes - "${notes}" - here's the answer to "${question}" (AI enhancement TBD)`);
        });
    });
}