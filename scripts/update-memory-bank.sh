#!/bin/bash
# Update Memory Bank Documentation
# This script runs the documentation anchor verification and updates the "Recently Updated Documents" section in INDEX.md

set -e

# Print header
echo "====================================="
echo "Memory Bank Documentation Verification"
echo "====================================="
echo ""

# Check if the verify_doc_anchors.py script exists
if [ ! -f "scripts/verify_doc_anchors.py" ]; then
    echo "Error: verify_doc_anchors.py script not found!"
    exit 1
fi

# Run the verification script
echo "Running documentation anchor verification..."
python scripts/verify_doc_anchors.py

# If verification passes, update the "Recently Updated Documents" section
if [ $? -eq 0 ]; then
    echo ""
    echo "Verification passed! Updating 'Recently Updated Documents' section..."
    python scripts/verify_doc_anchors.py --fix

    echo ""
    echo "Memory bank documentation is now up-to-date!"
else
    echo ""
    echo "Verification failed! Please fix the issues before updating the memory bank."
    exit 1
fi

echo ""
echo "====================================="
echo "Documentation Update Complete"
echo "====================================="
