#!/bin/bash
# Script to test GitHub Actions workflows locally using act
# https://github.com/nektos/act

# Check if act is installed
if ! command -v act &> /dev/null; then
    echo "Error: 'act' is not installed."
    echo "Please install it following the instructions at: https://github.com/nektos/act#installation"
    exit 1
fi

# Default workflow to test
WORKFLOW="ci.yml"

# Default values
IMAGE=""
JOB=""
CONTAINER_ARCH=""
ACT_ARGS=""

# Parse command line arguments
while [[ $# -gt 0 ]]; do
    key="$1"
    case $key in
        -w|--workflow)
            WORKFLOW="$2"
            shift
            shift
            ;;
        -e|--event)
            EVENT="$2"
            shift
            shift
            ;;
        -j|--job)
            JOB="$2"
            shift
            shift
            ;;
        --image)
            IMAGE="$2"
            shift
            shift
            ;;
        --container-architecture)
            CONTAINER_ARCH="$2"
            shift
            shift
            ;;
        --act-args)
            ACT_ARGS="$2"
            shift
            shift
            ;;
        -h|--help)
            echo "Usage: $0 [options]"
            echo ""
            echo "Options:"
            echo "  -w, --workflow WORKFLOW                Specify the workflow file to test (default: ci.yml)"
            echo "  -e, --event EVENT                      Specify the event type (push, pull_request, etc.)"
            echo "  -j, --job JOB                          Specify a specific job to run"
            echo "  --image IMAGE                          Specify a Docker image to use"
            echo "  --container-architecture ARCH          Specify container architecture (e.g., linux/amd64)"
            echo "  --act-args \"ARGS\"                      Additional arguments to pass to act"
            echo "  -h, --help                             Show this help message"
            echo ""
            echo "Available workflows:"
            echo "  - ci.yml                               CI workflow"
            echo "  - cd.yml                               CD workflow"
            echo "  - pre-commit.yml                       Pre-commit checks workflow"
            echo "  - code-coverage.yml                    Code coverage workflow"
            echo ""
            echo "Examples:"
            echo "  $0                                     Test the CI workflow with default settings"
            echo "  $0 -w pre-commit.yml                   Test the pre-commit workflow"
            echo "  $0 -w cd.yml -e tag                    Test the CD workflow with a tag event"
            echo "  $0 -w ci.yml -j backend-checks         Test only the backend-checks job in CI workflow"
            echo "  $0 --container-architecture linux/amd64 Test with specific architecture (for M1/M2 Macs)"
            exit 0
            ;;
        *)
            echo "Unknown option: $1"
            echo "Use --help for usage information"
            exit 1
            ;;
    esac
done

# Set default event if not specified
if [ -z "$EVENT" ]; then
    case $WORKFLOW in
        ci.yml)
            EVENT="push"
            ;;
        cd.yml)
            EVENT="push"
            ;;
        pre-commit.yml)
            EVENT="pull_request"
            ;;
        code-coverage.yml)
            EVENT="push"
            ;;
        *)
            EVENT="push"
            ;;
    esac
fi

echo "Testing workflow: $WORKFLOW with event: $EVENT"
echo "This may take some time depending on the workflow..."
echo ""

# Build the act command
ACT_CMD="act -W .github/workflows/$WORKFLOW -e .github/test-events/$EVENT.json --env ACT=true"

# Add job filter if specified
if [ -n "$JOB" ]; then
    ACT_CMD="$ACT_CMD -j $JOB"
fi

# Add image if specified
if [ -n "$IMAGE" ]; then
    ACT_CMD="$ACT_CMD -P $IMAGE"
fi

# Add container architecture if specified
if [ -n "$CONTAINER_ARCH" ]; then
    ACT_CMD="$ACT_CMD --container-architecture $CONTAINER_ARCH"
fi

# Add additional arguments if specified
if [ -n "$ACT_ARGS" ]; then
    ACT_CMD="$ACT_CMD $ACT_ARGS"
fi

# Run act with the specified options
echo "Running: $ACT_CMD"
eval $ACT_CMD

# Check if the test-events directory exists, if not provide guidance
if [ ! -d ".github/test-events" ]; then
    echo ""
    echo "Note: You may need to create test event JSON files in .github/test-events/"
    echo "See: https://github.com/nektos/act#the-event-file"
fi
