// Core functionality and utilities
const config = {
    apiUrl: 'http://127.0.0.1:5000/predict',
    maxFileSize: 5 * 1024 * 1024,
    validFileTypes: ['image/jpeg', 'image/png', 'image/x-dicom'],
    animationTexts: ["detection", "using", "scan", "through", "CNN"]
};

// Performance monitoring
class PerformanceTracker {
    static start(label) {
        performance.mark(`${label}-start`);
    }

    static end(label) {
        performance.mark(`${label}-end`);
        performance.measure(label, `${label}-start`, `${label}-end`);
        const measure = performance.getEntriesByName(label)[0];
        console.log(`${label}: ${measure.duration}ms`);
        this.logToAnalytics(label, measure.duration);
    }

    static logToAnalytics(label, duration) {
        if (window.gtag) {
            gtag('event', 'performance', {
                event_category: 'Performance',
                event_label: label,
                value: Math.round(duration)
            });
        }
    }
}

// Error handling
class ErrorHandler {
    static handle(error, context) {
        console.error(`Error in ${context}:`, error);
        this.showErrorMessage(error.message);
        this.logError(error, context);
    }

    static showErrorMessage(message) {
        const errorElement = document.querySelector('.error-message');
        errorElement.textContent = message;
        errorElement.style.display = 'block';
        setTimeout(() => errorElement.style.display = 'none', 5000);
    }

    static logError(error, context) {
        if (window.gtag) {
            gtag('event', 'error', {
                event_category: 'Error',
                event_label: `${context}: ${error.message}`
            });
        }
    }
}

// File handling
class FileHandler {
    static validate(file) {
        if (!file) throw new Error('No file selected');
        if (!config.validFileTypes.includes(file.type)) {
            throw new Error('Invalid file type. Please upload a valid medical image.');
        }
        if (file.size > config.maxFileSize) {
            throw new Error('File too large. Maximum size is 5MB.');
        }
        return true;
    }

    static async processFile(file) {
        try {
            this.validate(file);
            const formData = new FormData();
            formData.append('file', file);
            return formData;
        } catch (error) {
            throw error;
        }
    }
}

// UI handling
class UI {
    static showPreview(file) {
        const reader = new FileReader();
        const preview = document.getElementById('preview-image');
        const previewContainer = document.querySelector('.file-preview');

        reader.onload = (e) => {
            preview.src = e.target.result;
            previewContainer.hidden = false;
        };
        reader.readAsDataURL(file);
    }

    static updateProgress(percent) {
        const progressBar = document.querySelector('.progress-bar');
        const progressFill = document.querySelector('.progress-bar-fill');
        progressBar.hidden = false;
        progressFill.style.width = `${percent}%`;
    }

    static showResult(prediction) {
        const resultElement = document.getElementById('predictionResult');
        resultElement.textContent = `Prediction: ${prediction}`;
        resultElement.classList.add('animate__animated', 'animate__fadeIn');
    }
}

// API handling
class ApiClient {
    static async predict(formData) {
        const response = await fetch(config.apiUrl, {
            method: 'POST',
            body: formData,
            headers: {
                'X-CSRF-Token': document.querySelector('meta[name="csrf-token"]')?.content
            }
        });

        if (!response.ok) {
            throw new Error(`Server error: ${response.status}`);
        }

        return await response.json();
    }
}

// Service Worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('/sw.js')
            .then(registration => console.log('ServiceWorker registered'))
            .catch(error => ErrorHandler.handle(error, 'SW Registration'));
    });
}

// Event Listeners
document.addEventListener('DOMContentLoaded', () => {
    // Text animation
    let textIndex = 0;
    setInterval(() => {
        document.querySelector(".change_content").textContent = config.animationTexts[textIndex];
        textIndex = (textIndex + 1) % config.animationTexts.length;
    }, 2000);

    // File upload handling
    document.getElementById('file-upload').addEventListener('change', async (event) => {
        PerformanceTracker.start('fileProcessing');
        try {
            const file = event.target.files[0];
            const formData = await FileHandler.processFile(file);
            UI.showPreview(file);
            UI.updateProgress(50);

            const result = await ApiClient.predict(formData);
            UI.updateProgress(100);
            UI.showResult(result.prediction);
        } catch (error) {
            ErrorHandler.handle(error, 'File Processing');
        } finally {
            PerformanceTracker.end('fileProcessing');
        }
    });

    // Mode toggle
    document.querySelector('button[onclick="toggleMode()"]').addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        localStorage.setItem('theme', document.body.classList.contains('light-mode') ? 'light' : 'dark');
    });

    // Offline detection
    window.addEventListener('online', () => {
        document.querySelector('.offline-notice').style.display = 'none';
    });
    
    window.addEventListener('offline', () => {
        document.querySelector('.offline-notice').style.display = 'block';
    });
});

// Export functionality
window.exportResults = () => {
    const result = document.getElementById('predictionResult').textContent;
    const blob = new Blob([result], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'pneumonia-detection-result.txt';
    a.click();
    window.URL.revokeObjectURL(url);
};