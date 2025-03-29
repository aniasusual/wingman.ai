// let model = null;

// function preprocessText(transcript) {
//     const cleaned = transcript.trim().toLowerCase();
//     const words = cleaned.split(/\s+/);
//     return [
//         words.length,
//         cleaned.endsWith("?") ? 1 : 0,
//         ["what", "how", "why", "do", "can", "should"].some(starter => cleaned.startsWith(starter + " ")) ? 1 : 0,
//         ["question", "answer", "thoughts", "opinion", "idea"].some(kw => cleaned.includes(" " + kw + " ")) ? 1 : 0,
//         ["never mind", "forget it"].some(neg => cleaned.includes(neg)) ? 1 : 0
//     ];
// }

// async function loadModel() {
//     try {
//         // model = await tf.loadLayersModel(chrome.runtime.getURL('models/shouldQuery/model.json'));
//         model = await tf.loadLayersModel("models/shouldQuery/model.json");

//         console.log("Model loaded successfully.");
//         window.parent.postMessage({ action: "modelLoaded", status: "success" }, "*");
//     } catch (error) {
//         console.error("Error loading model:", error);
//         window.parent.postMessage({ action: "modelLoaded", status: "error", error: error.message }, "*");
//     }
// }

// async function shouldQueryAPI(transcript) {
//     if (!model) return false;

//     const features = preprocessText(transcript);

//     return tf.tidy(() => {
//         const inputTensor = tf.tensor2d([features]);
//         const prediction = model.predict(inputTensor);
//         const score = prediction.dataSync()[0];

//         console.log("Score: ", score);
//         return score > 0.5;
//     });
// }

// window.addEventListener("message", async (event) => {
//     const { action, transcript, callbackId } = event.data || {};
//     if (action === "predict") {
//         const result = await shouldQueryAPI(transcript);
//         window.parent.postMessage({ action: "predictionResult", result, callbackId }, "*");
//     }
// });

// // Load model immediately when sandbox is initialized
// loadModel();


let model = null;

function preprocessText(transcript) {
    const cleaned = transcript.trim().toLowerCase();
    const words = cleaned.split(/\s+/);
    const maxWordCount = 50; // Must match training
    return [
        Math.min(words.length, maxWordCount) / maxWordCount,
        cleaned.endsWith("?") ? 1 : 0,
        ["what", "how", "why", "do", "can", "should"].some(starter => cleaned.startsWith(starter + " ")) ? 1 : 0,
        ["question", "answer", "thoughts", "opinion", "idea"].some(kw => cleaned.includes(" " + kw + " ")) ? 1 : 0,
        ["never mind", "forget it"].some(neg => cleaned.includes(neg)) ? 1 : 0
    ];
}

async function loadModel() {
    try {
        // model = await tf.loadLayersModel("file://./models/shouldQuery/model.json");
        model = await tf.loadLayersModel("models/shouldQuery/model.json");

        console.log("Model loaded successfully.");
        // Test immediately after loading
        const testFeatures = preprocessText("What is the weather like?");
        const testTensor = tf.tensor2d([testFeatures]);
        const testPrediction = model.predict(testTensor);
        console.log("Test Prediction after loading:", testPrediction.dataSync()[0]);
        window.parent.postMessage({ action: "modelLoaded", status: "success" }, "*");
    } catch (error) {
        console.error("Error loading model:", error);
        window.parent.postMessage({ action: "modelLoaded", status: "error", error: error.message }, "*");
    }
}

async function shouldQueryAPI(transcript) {
    if (!model) return false;
    const features = preprocessText(transcript);
    console.log(`Input: "${transcript}", Features: [${features}]`);
    return tf.tidy(() => {
        const inputTensor = tf.tensor2d([features]);
        const prediction = model.predict(inputTensor);
        const score = prediction.dataSync()[0];
        console.log(`Predicted Score: ${score}`);
        return score > 0.5;
    });
}

window.addEventListener("message", async (event) => {
    const { action, transcript, callbackId } = event.data || {};
    if (action === "predict") {
        const result = await shouldQueryAPI(transcript);
        window.parent.postMessage({ action: "predictionResult", result, callbackId }, "*");
    }
});

loadModel();