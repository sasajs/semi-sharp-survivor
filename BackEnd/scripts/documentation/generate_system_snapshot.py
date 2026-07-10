"""
SemiSharp System Snapshot Generator

Creates current system reference documents after successful regression tests.

Generates:
- Documentation/semisharp_directory_structure.txt
- Documentation/database_dictionary.txt
- Documentation/database_dictionary.json
- Documentation/API_CATALOG.md
"""

import os
import subprocess
import sys


BACKEND_DIR = os.path.abspath(
    os.path.join(
        os.path.dirname(__file__),
        "../.."
    )
)

PROJECT_ROOT = os.path.abspath(
    os.path.join(
        BACKEND_DIR,
        ".."
    )
)

DOCS_DIR = os.path.join(
    PROJECT_ROOT,
    "Documentation"
)

os.makedirs(
    DOCS_DIR,
    exist_ok=True
)


def run_command(command):

    print("")
    print("RUNNING:")
    print(" ".join(command))

    result = subprocess.run(
        command,
        cwd=BACKEND_DIR
    )

    if result.returncode != 0:
        print("FAILED:")
        print(command)
        sys.exit(1)


def main():

    print("================================")
    print("SemiSharp System Snapshot")
    print("================================")


    # Code structure

    print("\nGenerating code structure...")

    output = os.path.join(
        DOCS_DIR,
        "semisharp_directory_structure.txt"
    )

    with open(output, "w") as f:

        subprocess.run(
            [
                "tree",
                "-a",
                "-I",
                "node_modules|__pycache__|.git|dist|*.pyc"
            ],
            stdout=f
        )


    # Database dictionary

    run_command(
        [
            "python",
            "scripts/database/generate_database_dictionary.py"
        ]
    )


    # API catalog

    run_command(
        [
            "python",
            "scripts/documentation/generate_api_catalog.py"
        ]
    )


    print("")
    print("================================")
    print("SYSTEM SNAPSHOT COMPLETE")
    print("================================")


if __name__ == "__main__":
    main()
