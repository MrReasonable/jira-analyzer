# Base stage for common dependencies
FROM python:3.13-slim AS base

WORKDIR /app

# Install system dependencies
RUN apt-get update && apt-get install -y \
    build-essential \
    gcc \
    g++ \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --upgrade pip && \
    pip install --no-cache-dir -r requirements.txt

# Development stage with additional tools
FROM base AS development

# Install development dependencies
RUN pip install --no-cache-dir \
    pytest \
    pytest-cov \
    ruff \
    pre-commit \
    debugpy \
    httpx \
    mypy \
    bandit

# Copy application code
COPY . .

# Create .env from example if it doesn't exist
RUN cp --update .env.example .env || true

# Expose ports for app and debugger
EXPOSE 8000
EXPOSE 5678

# Command to run the application with debugger enabled
CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", "--wait-for-client", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# Enhanced development stage with additional system dependencies
FROM base AS development-enhanced

# Install additional system dependencies
RUN apt-get update && apt-get install -y \
    cmake \
    git \
    && apt-get clean \
    && rm -rf /var/lib/apt/lists/*

# Install development dependencies
RUN pip install --no-cache-dir \
    pytest \
    pytest-cov \
    ruff \
    pre-commit \
    debugpy \
    httpx \
    mypy \
    bandit

# Copy application code
COPY . .

# Create .env from example if it doesn't exist
RUN cp --update .env.example .env || true

# Expose ports for app and debugger
EXPOSE 8000
EXPOSE 5678

# Command to run the application with debugger enabled
CMD ["python", "-m", "debugpy", "--listen", "0.0.0.0:5678", "--wait-for-client", "-m", "uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000", "--reload"]

# CI stage for testing
FROM development AS ci

# Default command for CI (can be overridden at runtime)
CMD ["pytest"]

# Production stage
FROM base AS production

# Create non-root user for production
RUN groupadd -g 1000 appuser && \
    useradd -u 1000 -g appuser -s /bin/sh -m appuser

# Copy application code
COPY . .

# Create .env from example if it doesn't exist
RUN cp --update .env.example .env || true && \
    chown -R appuser:appuser /app

# Expose the port the app runs on
EXPOSE 8000

# Switch to non-root user
USER appuser

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Alpine-based production alternative (smaller image)
FROM python:3.13-alpine AS alpine

WORKDIR /app

# Install system dependencies
RUN apk add --no-cache \
    gcc \
    musl-dev \
    python3-dev

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Create .env from example if it doesn't exist
RUN cp --update .env.example .env || true

# Expose the port the app runs on
EXPOSE 8000

# Command to run the application
CMD ["uvicorn", "app.main:app", "--host", "0.0.0.0", "--port", "8000"]

# Default to production stage
FROM production
