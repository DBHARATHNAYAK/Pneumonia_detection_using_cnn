from flask import Flask, request, jsonify
import tensorflow as tf
import numpy as np
from PIL import Image
import io
from flask_cors import CORS

app = Flask(__name__)
CORS(app)

# Load your trained model
model = tf.keras.models.load_model("C:\\Users\\SRIRAM SHRAVAN\\projects\\project school\\pneumonia_detection_model.h5")

@app.route('/predict', methods=['POST'])
def predict():
    if 'file' not in request.files:
        return jsonify({'error': 'No file part'})

    file = request.files['file']
    if file.filename == '':
        return jsonify({'error': 'No selected file'})

    try:
        # Open the image file
        image = Image.open(io.BytesIO(file.read()))

        # Convert the image to RGB (to ensure 3 channels)
        image = image.convert('RGB')  # Convert to RGB if the model expects RGB input
        image = image.resize((64, 64))  # Resize to match model input size
        image_array = np.array(image) / 255.0  # Normalize the image
        image_array = np.expand_dims(image_array, axis=0)  # Add batch dimension (1, 64, 64, 3)

        # Make the prediction
        prediction = model.predict(image_array)

        # Return the result as a JSON response
        result = 'Pneumonia' if prediction[0][0] > 0.5 else 'Normal'
        return jsonify({'prediction': result})

    except Exception as e:
        return jsonify({'error': str(e)})

if __name__ == '__main__':
    app.run(debug=True)
