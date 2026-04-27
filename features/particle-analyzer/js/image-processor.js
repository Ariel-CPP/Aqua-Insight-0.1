// Image Processor - RGB Stack & Thresholding
class ImageProcessor {
    constructor() {
        this.originalImage = null;
        this.channels = {};
    }

    async loadImage(file) {
        return new Promise((resolve, reject) => {
            const img = new Image();
            img.onload = () => {
                this.originalImage = img;
                resolve(img);
            };
            img.onerror = reject;
            img.src = URL.createObjectURL(file);
        });
    }

    extractChannels(img) {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        canvas.width = img.width;
        canvas.height = img.height;
        
        ctx.drawImage(img, 0, 0);
        const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
        const data = imageData.data;

        // Extract R, G, B channels
        this.channels = {
            original: imageData,
            red: this.createChannelImageData(data, canvas.width, canvas.height, 0),
            green: this.createChannelImageData(data, canvas.width, canvas.height, 1),
            blue: this.createChannelImageData(data, canvas.width, canvas.height, 2)
        };
    }

    createChannelImageData(data, width, height, channelIndex) {
        const imageData = new ImageData(width, height);
        const targetData = imageData.data;
        
        for (let i = 0; i < data.length; i += 4) {
            const val = data[i + channelIndex];
            targetData[i] = val;     // R
            targetData[i + 1] = val; // G
            targetData[i + 2] = val; // B
            targetData[i + 3] = 255; // A
        }
        
        return imageData;
    }

    getChannelImageData(channel) {
        return this.channels[channel];
    }

    applyThreshold(imageData, threshold, darkBg = false) {
        const data = imageData.data;
        const newImageData = new ImageData(imageData.width, imageData.height);
        const newData = newImageData.data;

        for (let i = 0; i < data.length; i += 4) {
            const gray = (data[i] + data[i + 1] + data[i + 2]) / 3;
            const isParticle = darkBg ? gray < threshold : gray > threshold;

            if (isParticle) {
                newData[i] = 255;     // R
                newData[i + 1] = 255; // G
                newData[i + 2] = 255; // B
            } else {
                newData[i] = 0;       // R
                newData[i + 1] = 0;   // G
                newData[i + 2] = 0;   // B
            }
            newData[i + 3] = 255;     // A
        }

        return newImageData;
    }

    getCanvasContext(canvasId) {
        const canvas = document.getElementById(canvasId);
        return canvas.getContext('2d');
    }
}
