#!/usr/bin/env python3
"""Documentation Anchor Verification Script.

This script verifies that documentation anchors in code files match references in documentation files.
It helps prevent documentation drift and ensures that API documentation stays in sync with code.

Usage:
    python scripts/verify_doc_anchors.py [--fix]

Options:
    --fix    Attempt to fix simple issues automatically
"""

import argparse
import os
import re
import sys
from pathlib import Path
from typing import Dict, List, NamedTuple, Tuple

# Configuration
CODE_PATHS = [
    "backend/app/routers",
    "backend/app/schemas.py",
    "frontend/src/api",
    "frontend/src/types",
]

DOC_PATHS = [
    "memory-bank/api",
    "memory-bank/features",
]

# Regular expressions for finding anchors and references
CODE_ANCHOR_PATTERN = re.compile(r"#\s*DOC-ANCHOR:\s*(\w+)")
CODE_SYNC_PATTERN = re.compile(r"#\s*DOC-SYNC:\s*([a-zA-Z0-9_\-./]+)#([a-zA-Z0-9_\-]+)")
DOC_REF_PATTERN = re.compile(r"<!--\s*CODE-REF:\s*([a-zA-Z0-9_\-./]+)#(\w+)\s*-->")

# File extensions to process
CODE_EXTENSIONS = {".py", ".ts", ".tsx", ".js", ".jsx"}
DOC_EXTENSIONS = {".md"}


class Anchor(NamedTuple):
    """Represents a documentation anchor in code."""

    file_path: str
    name: str
    line_number: int
    context: str  # The line of code containing the anchor


class Reference(NamedTuple):
    """Represents a code reference in documentation."""

    file_path: str
    target_file: str
    anchor_name: str
    line_number: int


class SyncPoint(NamedTuple):
    """Represents a synchronization point between code and documentation."""

    file_path: str
    doc_path: str
    anchor_name: str
    line_number: int


class ValidationError(NamedTuple):
    """Represents a validation error."""

    error_type: str
    message: str
    file_path: str
    line_number: int


def find_code_anchors(
    code_paths: List[str],
) -> Tuple[Dict[str, Dict[str, Anchor]], List[SyncPoint]]:
    """Find all DOC-ANCHOR comments in code files.

    Returns:
        A tuple containing:
        - A dictionary mapping file paths to dictionaries mapping anchor names to Anchor objects
        - A list of SyncPoint objects
    """
    anchors = {}
    sync_points = []

    for base_path in code_paths:
        base_path = Path(base_path)
        if base_path.is_file():
            files = [base_path]
        else:
            files = [
                p
                for p in base_path.glob("**/*")
                if p.is_file() and p.suffix in CODE_EXTENSIONS
            ]

        for file_path in files:
            file_anchors = {}
            with open(file_path, "r", encoding="utf-8") as f:
                for i, line in enumerate(f, 1):
                    # Find DOC-ANCHOR comments
                    match = CODE_ANCHOR_PATTERN.search(line)
                    if match:
                        anchor_name = match.group(1)
                        file_anchors[anchor_name] = Anchor(
                            file_path=str(file_path),
                            name=anchor_name,
                            line_number=i,
                            context=line.strip(),
                        )

                    # Find DOC-SYNC comments
                    sync_match = CODE_SYNC_PATTERN.search(line)
                    if sync_match:
                        doc_path, anchor_name = sync_match.groups()
                        sync_points.append(
                            SyncPoint(
                                file_path=str(file_path),
                                doc_path=doc_path,
                                anchor_name=anchor_name,
                                line_number=i,
                            )
                        )

            if file_anchors:
                anchors[str(file_path)] = file_anchors

    return anchors, sync_points


def find_doc_references(doc_paths: List[str]) -> List[Reference]:
    """Find all CODE-REF tags in documentation files."""
    references = []

    for base_path in doc_paths:
        base_path = Path(base_path)
        if base_path.is_file():
            files = [base_path]
        else:
            files = [
                p
                for p in base_path.glob("**/*")
                if p.is_file() and p.suffix in DOC_EXTENSIONS
            ]

        for file_path in files:
            with open(file_path, "r", encoding="utf-8") as f:
                for i, line in enumerate(f, 1):
                    for match in DOC_REF_PATTERN.finditer(line):
                        target_file, anchor_name = match.groups()
                        references.append(
                            Reference(
                                file_path=str(file_path),
                                target_file=target_file,
                                anchor_name=anchor_name,
                                line_number=i,
                            )
                        )

    return references


def validate_references(
    anchors: Dict[str, Dict[str, Anchor]],
    references: List[Reference],
    sync_points: List[SyncPoint],
) -> List[ValidationError]:
    """Validate that all references point to existing anchors."""
    errors = []

    # Check that all references point to existing anchors
    for ref in references:
        target_path = ref.target_file

        # Handle relative paths
        if not os.path.isabs(target_path):
            # Try to resolve the path relative to the project root
            possible_paths = [
                target_path,
                f"backend/app/{target_path}",
                f"frontend/src/{target_path}",
            ]

            found = False
            for path in possible_paths:
                if path in anchors and ref.anchor_name in anchors[path]:
                    found = True
                    break

            if not found:
                errors.append(
                    ValidationError(
                        error_type="MISSING_ANCHOR",
                        message=f"Reference to non-existent anchor '{ref.anchor_name}' in file '{ref.target_file}'",
                        file_path=ref.file_path,
                        line_number=ref.line_number,
                    )
                )

    # Check that all sync points have corresponding documentation
    for sync in sync_points:
        doc_path = sync.doc_path

        # Handle relative paths
        if not os.path.isabs(doc_path):
            # Try to resolve the path relative to the memory-bank directory
            possible_paths = [
                doc_path,
                f"memory-bank/{doc_path}",
                f"memory-bank/api/{doc_path}",
                f"memory-bank/features/{doc_path}",
            ]

            found = False
            for path in possible_paths:
                if os.path.exists(path):
                    found = True
                    # Check if the anchor exists in the documentation
                    with open(path, "r", encoding="utf-8") as f:
                        content = f.read()
                        if f"#{sync.anchor_name}" not in content:
                            errors.append(
                                ValidationError(
                                    error_type="MISSING_DOC_ANCHOR",
                                    message=f"Sync point '{sync.anchor_name}' not found in documentation file '{path}'",
                                    file_path=sync.file_path,
                                    line_number=sync.line_number,
                                )
                            )
                    break

            if not found:
                errors.append(
                    ValidationError(
                        error_type="MISSING_DOC_FILE",
                        message=f"Documentation file '{doc_path}' referenced by sync point does not exist",
                        file_path=sync.file_path,
                        line_number=sync.line_number,
                    )
                )

    return errors


def update_recently_updated_section(fix_mode: bool = False) -> None:
    """Update the 'Recently Updated Documents' section in INDEX.md."""
    index_path = "memory-bank/INDEX.md"
    if not os.path.exists(index_path):
        print(
            f"Warning: {index_path} not found, skipping update of recently updated section"
        )
        return

    # Find all documentation files modified in the last 7 days
    recent_files = []
    for doc_path in DOC_PATHS:
        doc_path = Path(doc_path)
        if doc_path.is_file():
            files = [doc_path]
        else:
            files = [
                p
                for p in doc_path.glob("**/*")
                if p.is_file() and p.suffix in DOC_EXTENSIONS
            ]

        for file_path in files:
            # Check if file was modified in the last 7 days
            # In a real implementation, you might use git to check recent changes
            # For this example, we'll just add all files
            recent_files.append(str(file_path))

    # Group files by category
    categories = {
        "Core": [],
        "Patterns": [],
        "Testing": [],
        "Code Patterns": [],
        "Features": [],
        "API": [],
        "Deployment": [],
    }

    for file_path in recent_files:
        if "memory-bank/api/" in file_path:
            categories["API"].append(file_path)
        elif "memory-bank/features/" in file_path:
            categories["Features"].append(file_path)
        elif "memory-bank/patterns/" in file_path:
            categories["Patterns"].append(file_path)
        elif "memory-bank/testing/" in file_path:
            categories["Testing"].append(file_path)
        elif "memory-bank/code-patterns/" in file_path:
            categories["Code Patterns"].append(file_path)
        elif "memory-bank/deployment/" in file_path:
            categories["Deployment"].append(file_path)
        elif file_path in [
            "memory-bank/projectbrief.md",
            "memory-bank/productContext.md",
            "memory-bank/systemPatterns.md",
            "memory-bank/techContext.md",
            "memory-bank/activeContext.md",
            "memory-bank/progress.md",
        ]:
            categories["Core"].append(file_path)

    # If in fix mode, update the INDEX.md file
    if fix_mode:
        with open(index_path, "r", encoding="utf-8") as f:
            content = f.read()

        # Find the "Recently Updated Documents" section
        section_start = content.find("## Recently Updated Documents")
        if section_start == -1:
            print(
                f"Warning: Could not find 'Recently Updated Documents' section in {index_path}"
            )
            return

        section_end = content.find("##", section_start + 1)
        if section_end == -1:
            section_end = len(content)

        # Build the new section content
        new_section = "## Recently Updated Documents\n\n"
        new_section += "The following documents have been recently updated with executive summaries and quick reference guides:\n\n"
        new_section += "| Category          | Documents                                                                                                                                                                                                             |\n"
        new_section += "| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |\n"

        for category, files in categories.items():
            if not files:
                continue

            # Convert file paths to markdown links
            links = []
            for file_path in files:
                # Remove memory-bank/ prefix and .md suffix
                link_path = file_path.replace("memory-bank/", "./")
                name = os.path.basename(file_path).replace(".md", "")
                # Convert kebab-case to Title Case
                name = " ".join(word.capitalize() for word in name.split("-"))
                links.append(f"[{name}]({link_path})")

            new_section += f"| **{category}**          | {', '.join(links)} |\n"

        # Replace the old section with the new one
        new_content = content[:section_start] + new_section + content[section_end:]

        with open(index_path, "w", encoding="utf-8") as f:
            f.write(new_content)

        print(f"Updated 'Recently Updated Documents' section in {index_path}")


def main():
    """Run the documentation anchor verification process."""
    parser = argparse.ArgumentParser(description="Verify documentation anchors")
    parser.add_argument(
        "--fix", action="store_true", help="Attempt to fix simple issues automatically"
    )
    args = parser.parse_args()

    print("Finding code anchors...")
    anchors, sync_points = find_code_anchors(CODE_PATHS)

    print("Finding documentation references...")
    references = find_doc_references(DOC_PATHS)

    print("Validating references...")
    errors = validate_references(anchors, references, sync_points)

    if errors:
        print("\nValidation errors:")
        for error in errors:
            print(
                f"{error.file_path}:{error.line_number}: {error.error_type}: {error.message}"
            )

        if args.fix:
            print("\nAttempting to fix issues...")
            # Implement automatic fixes here
            # For example, you could create missing documentation files
            # or add missing anchors to documentation

            # Re-validate after fixes
            errors = validate_references(anchors, references, sync_points)
            if not errors:
                print("All issues fixed!")
            else:
                print("Some issues could not be fixed automatically.")
                sys.exit(1)
        else:
            sys.exit(1)
    else:
        print("All documentation anchors are valid!")

    print("\nUpdating 'Recently Updated Documents' section...")
    update_recently_updated_section(fix_mode=args.fix)

    print("Done!")


if __name__ == "__main__":
    main()
