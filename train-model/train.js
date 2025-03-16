// train.js
const tf = require('@tensorflow/tfjs-node');
const fs = require("fs")
const trainingData = JSON.parse(fs.readFileSync('./diverse_training_data.json', 'utf8')); // Replace with actual path

async function trainAndSave() {
    const model = tf.sequential();
    model.add(tf.layers.dense({ units: 10, activation: 'relu', inputShape: [5] }));
    model.add(tf.layers.dense({ units: 1, activation: 'sigmoid' }));
    model.compile({ optimizer: 'adam', loss: 'binaryCrossentropy' });


    function preprocessText(transcript) {
        const cleaned = transcript.trim().toLowerCase();
        const words = cleaned.split(/\s+/);
        return [
            words.length,
            cleaned.endsWith("?") ? 1 : 0,
            ["what", "how", "why"].some(starter => cleaned.startsWith(starter + " ")) ? 1 : 0,
            ["question", "answer"].some(kw => cleaned.includes(" " + kw + " ")) ? 1 : 0,
            ["never mind", "forget it"].some(neg => cleaned.includes(neg)) ? 1 : 0
        ];
    }

    const xs = tf.tensor2d(trainingData.map(item => preprocessText(item.text)));
    const ys = tf.tensor2d(trainingData.map(item => [item.label]));

    await model.fit(xs, ys, { epochs: 50 });
    await model.save('file:///Users/animeshdhillon/Desktop/wingman.ai/lib/models/shouldQuery');
}

trainAndSave();