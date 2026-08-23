"""
Obesity Risk Prediction – Flask ML Service
Loads the trained Random Forest pipeline and exposes a /predict endpoint.
"""

import os
import traceback
import joblib
import pandas as pd
from flask import Flask, request, jsonify
from flask_cors import CORS

# Compatibility fix for newer scikit-learn unpickling older pipelines
import sklearn.compose._column_transformer
if not hasattr(sklearn.compose._column_transformer, '_RemainderColsList'):
    class _RemainderColsList(list):
        pass
    sklearn.compose._column_transformer._RemainderColsList = _RemainderColsList

from sklearn.impute import SimpleImputer

# ---------------------------------------------------------------------------
# App setup
# ---------------------------------------------------------------------------
app = Flask(__name__)
CORS(app)

# ---------------------------------------------------------------------------
# Load model once at startup
# ---------------------------------------------------------------------------
MODEL_PATH = os.path.join(os.path.dirname(__file__), 'models', 'final_obesity_random_forest_pipeline.joblib')

def _patch_pipeline_attributes(pipe):
    """Patch missing attributes on deserialized sklearn transformers across version gaps."""
    if hasattr(pipe, 'named_steps'):
        for step in pipe.named_steps.values():
            if hasattr(step, 'transformers_'):
                for trans_entry in step.transformers_:
                    trans = trans_entry[1] if len(trans_entry) > 1 else None
                    if hasattr(trans, 'steps'):
                        for _, s_trans in trans.steps:
                            if isinstance(s_trans, SimpleImputer) and not hasattr(s_trans, '_fill_dtype'):
                                s_trans._fill_dtype = getattr(s_trans, '_fit_dtype', None)

try:
    pipeline = joblib.load(MODEL_PATH)
    _patch_pipeline_attributes(pipeline)
    print(f'[ML Service] Model loaded successfully from {MODEL_PATH}')
except Exception as e:
    print(f'[ML Service] FATAL – Failed to load model: {e}')
    pipeline = None

# The 17 features the model was trained on, in the exact order
EXPECTED_FEATURES = [
    'Age', 'Gender', 'Height', 'Weight',
    'CALC', 'FAVC', 'FCVC', 'NCP', 'SCC', 'SMOKE',
    'CH2O', 'family_history_with_overweight',
    'FAF', 'TUE', 'CAEC', 'MTRANS',
    'Physical_Activity_Score'
]

# ---------------------------------------------------------------------------
# Health-check
# ---------------------------------------------------------------------------
@app.route('/health', methods=['GET'])
def health():
    return jsonify({
        'status': 'ok' if pipeline is not None else 'model_not_loaded',
        'model': MODEL_PATH
    })

# ---------------------------------------------------------------------------
# Prediction endpoint
# ---------------------------------------------------------------------------
@app.route('/predict', methods=['POST'])
def predict():
    if pipeline is None:
        return jsonify({'error': 'Model not loaded. Check server logs.'}), 503

    data = request.get_json(silent=True)
    if not data:
        return jsonify({'error': 'Request body must be valid JSON.'}), 400

    # Validate all required features are present
    missing = [f for f in EXPECTED_FEATURES if f not in data]
    if missing:
        return jsonify({'error': f'Missing features: {missing}'}), 400

    try:
        # Build a single-row DataFrame in the exact feature order
        row = {feat: data[feat] for feat in EXPECTED_FEATURES}
        df = pd.DataFrame([row])

        # Cast numeric columns
        numeric_cols = ['Age', 'Height', 'Weight', 'FCVC', 'NCP', 'CH2O', 'FAF', 'TUE', 'Physical_Activity_Score']
        for col in numeric_cols:
            df[col] = pd.to_numeric(df[col], errors='coerce')

        # Predict
        predicted_class = pipeline.predict(df)[0]
        probabilities_array = pipeline.predict_proba(df)[0]
        class_labels = pipeline.classes_

        # Build sorted probability list
        prob_list = [
            {'class': str(label), 'probability': round(float(prob) * 100, 2)}
            for label, prob in zip(class_labels, probabilities_array)
        ]
        prob_list.sort(key=lambda x: x['probability'], reverse=True)

        # Confidence = probability of the predicted class
        confidence = round(float(max(probabilities_array)) * 100, 2)

        return jsonify({
            'predicted_class': str(predicted_class),
            'confidence': confidence,
            'probabilities': prob_list[:3]  # top 3
        })

    except Exception as e:
        traceback.print_exc()
        return jsonify({'error': f'Prediction failed: {str(e)}'}), 500

# ---------------------------------------------------------------------------
# Run
# ---------------------------------------------------------------------------
if __name__ == '__main__':
    port = int(os.environ.get('PORT', os.environ.get('ML_PORT', 5001)))
    print(f'[ML Service] Starting on port {port}')
    app.run(host='0.0.0.0', port=port, debug=False)
