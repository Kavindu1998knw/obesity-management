# ==============================================================================
# Python Flask Machine Learning Service (Random Forest Pipeline)
# ==============================================================================
FROM python:3.11-slim

WORKDIR /app

# Prevent python from writing pyc files and buffer stdout/stderr
ENV PYTHONDONTWRITEBYTECODE=1
ENV PYTHONUNBUFFERED=1

# Install Python dependencies
COPY requirements.txt ./
RUN pip install --no-cache-dir -r requirements.txt

# Copy Flask app code and pre-trained Random Forest model
COPY . .

# Expose ML microservice port
EXPOSE 5001

# Health check using Python's built-in standard library
HEALTHCHECK --interval=30s --timeout=5s --start-period=10s --retries=3 \
  CMD python -c "import urllib.request; sys_exit = 0 if urllib.request.urlopen('http://localhost:5001/health').getcode() == 200 else 1; exit(sys_exit)"

# Start the Flask ML inference server
CMD ["python", "app.py"]
