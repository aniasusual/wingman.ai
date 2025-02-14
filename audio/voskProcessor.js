class VoskProcessor extends AudioWorkletProcessor {
    constructor() {
        super();
        this.recognizer = null;
        this.port.onmessage = (event) => {
            if (event.data.action === "loadModel") {
                this.recognizer = event.data.modelData;
            }
        };
    }

    process(inputs) {
        if (!this.recognizer || inputs.length === 0 || inputs[0].length === 0) {
            return true;
        }

        const input = inputs[0][0]; // Get mono audio data
        const int16Array = new Int16Array(input.length);

        for (let i = 0; i < input.length; i++) {
            int16Array[i] = input[i] * 32767;
        }

        const result = this.recognizer.acceptWaveform(int16Array);
        if (result) {
            this.port.postMessage({ transcript: this.recognizer.result().text });
        }

        return true;
    }
}

registerProcessor("vosk-processor", VoskProcessor);
