// // train.js
// const tf = require('@tensorflow/tfjs-node');
// const fs = require("fs")
// const trainingData = JSON.parse(fs.readFileSync('./diverse_training_data.json', 'utf8')); // Replace with actual path

// async function trainAndSave() {
//     const model = tf.sequential();
//     model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [5] }));
//     model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
//     model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });


//     function preprocessText(transcript) {
//         const cleaned = transcript.trim().toLowerCase();
//         const words = cleaned.split(/\s+/);
//         return [
//             words.length,
//             cleaned.endsWith("?") ? 1 : 0,
//             ["what", "how", "why"].some(starter => cleaned.startsWith(starter + " ")) ? 1 : 0,
//             ["question", "answer"].some(kw => cleaned.includes(" " + kw + " ")) ? 1 : 0,
//             ["never mind", "forget it"].some(neg => cleaned.includes(neg)) ? 1 : 0
//         ];
//     }

//     const xs = tf.tensor2d(trainingData.map(item => preprocessText(item.text)));
//     const ys = tf.tensor2d(trainingData.map(item => [item.label]));

//     await model.fit(xs, ys, { epochs: 50 });
//     await model.save('file:///Users/animeshdhillon/Desktop/wingman.ai/lib/models/shouldQuery');
// }

///////////////
const tf = require('@tensorflow/tfjs-node');
const fs = require("fs");

const datasetPath = "./large_training_data.json";
const modelPath = "./models/shouldQuery";

async function loadDataset() {
    try {
        const data = fs.readFileSync(datasetPath, "utf8");
        const jsonData = JSON.parse(data);
        if (!Array.isArray(jsonData)) throw new Error("Dataset should be an array");
        return jsonData;
    } catch (error) {
        console.error("Error reading dataset:", error);
        return [];
    }
}

function preprocessText(transcript) {
    const cleaned = transcript.trim().toLowerCase();
    const words = cleaned.split(/\s+/);
    const maxWordCount = 50; // Adjust based on your data
    return [
        Math.min(words.length, maxWordCount) / maxWordCount,
        cleaned.endsWith("?") ? 1 : 0,
        ["what", "how", "why", "do", "can", "should"].some(starter => cleaned.startsWith(starter + " ")) ? 1 : 0,
        ["question", "answer", "thoughts", "opinion", "idea"].some(kw => cleaned.includes(" " + kw + " ")) ? 1 : 0,
        ["never mind", "forget it"].some(neg => cleaned.includes(neg)) ? 1 : 0
    ];
}

async function trainAndSave() {
    const trainingData = await loadDataset();

    if (trainingData.length === 0) {
        console.error("No valid training data found. Exiting...");
        return;
    }

    const labelCounts = trainingData.reduce((acc, item) => {
        acc[item.label] = (acc[item.label] || 0) + 1;
        return acc;
    }, {});
    console.log("Label distribution:", labelCounts);

    const sampleInputs = [
        "What is the weather like?",
        "Never mind, I don’t care.",
        "Can you help me?",
        "This is a statement."
    ];
    console.log("Preprocessing sample inputs:");
    sampleInputs.forEach(input => {
        console.log(`Input: "${input}" -> Features: ${preprocessText(input)}`);
    });

    try {
        const xsArray = trainingData.map(item => preprocessText(item.text));
        const ysArray = trainingData.map(item => [item.label]);

        if (xsArray.length === 0 || ysArray.length === 0) {
            throw new Error("Processed data is empty.");
        }

        const xs = tf.tensor2d(xsArray, [xsArray.length, xsArray[0].length]);
        const ys = tf.tensor2d(ysArray, [ysArray.length, 1]);

        const model = tf.sequential();
        model.add(tf.layers.dense({ units: 16, activation: 'relu', inputShape: [5] }));
        model.add(tf.layers.dense({ units: 8, activation: 'relu' }));
        model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
        model.compile({
            optimizer: tf.train.adam(0.001),
            loss: 'binaryCrossentropy',
            metrics: ['accuracy']
        });

        // Logging callback only
        const loggingCallback = {
            onEpochEnd: (epoch, logs) => {
                console.log(`Epoch ${epoch + 1}: Loss = ${logs.loss.toFixed(4)}, Accuracy = ${logs.acc.toFixed(4)}, Val Loss = ${logs.val_loss.toFixed(4)}, Val Accuracy = ${logs.val_acc.toFixed(4)}`);
            }
        };

        await model.fit(xs, ys, {
            epochs: 50,
            batchSize: 512,
            validationSplit: 0.2,
            callbacks: [loggingCallback] // No early stopping
        });

        console.log("\nTesting predictions on first 5 training examples:");
        const testXs = tf.tensor2d(xsArray.slice(0, 5));
        const testYs = ysArray.slice(0, 5);
        const predictions = model.predict(testXs);
        const predValues = predictions.dataSync();
        testYs.forEach((label, i) => {
            console.log(`Example ${i + 1}: True Label = ${label[0]}, Predicted Score = ${predValues[i].toFixed(6)}`);
        });

        if (!fs.existsSync(modelPath)) {
            fs.mkdirSync(modelPath, { recursive: true });
        }

        await model.save(`file://${modelPath}`);
        console.log("Model training complete and saved.");
    } catch (error) {
        console.error("Error during training:", error);
    }
}

trainAndSave();