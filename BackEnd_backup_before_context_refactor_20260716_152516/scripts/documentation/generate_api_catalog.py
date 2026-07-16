"""
SemiSharp API Catalog Generator V3.0

Creates:
    ~/Projects/SemiSharp/Documentation/API_CATALOG.md

Source:
    FastAPI OpenAPI schema

Usage:
    python scripts/documentation/generate_api_catalog.py
"""

import os
import sys
from datetime import datetime


# -------------------------------------------------
# Establish paths
# -------------------------------------------------

SCRIPT_DIR = os.path.dirname(
    os.path.abspath(__file__)
)

BACKEND_DIR = os.path.abspath(
    os.path.join(
        SCRIPT_DIR,
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

OUTPUT_FILE = os.path.join(
    DOCS_DIR,
    "API_CATALOG.md"
)


# -------------------------------------------------
# Configure Python imports
# -------------------------------------------------

sys.path.insert(
    0,
    BACKEND_DIR
)


# -------------------------------------------------
# Load environment
# -------------------------------------------------

from dotenv import load_dotenv

load_dotenv(
    os.path.join(
        BACKEND_DIR,
        ".env"
    )
)


# -------------------------------------------------
# Import FastAPI application
# -------------------------------------------------

try:

    from app.main import app

except Exception as e:

    print(
        "ERROR importing FastAPI application:"
    )

    print(e)

    print(
        "\nCheck app/main.py imports and environment settings."
    )

    sys.exit(1)



# -------------------------------------------------
# Generate catalog
# -------------------------------------------------

def main():

    print("Generating API catalog...")

    openapi = app.openapi()

    paths = openapi.get(
        "paths",
        {}
    )


    with open(
        OUTPUT_FILE,
        "w",
        encoding="utf-8"
    ) as f:


        f.write(
            "# SemiSharp API Catalog\n\n"
        )

        f.write(
            f"Generated: {datetime.now()}\n\n"
        )

        f.write(
            f"Total API Routes: {len(paths)}\n\n"
        )

        f.write(
            "---\n\n"
        )


        for path, methods in sorted(paths.items()):


            for method, details in methods.items():


                if method.lower() == "parameters":

                    continue


                f.write(
                    f"## {method.upper()} {path}\n\n"
                )


                tags = details.get(
                    "tags",
                    []
                )

                if tags:

                    f.write(
                        f"**Tags:** {', '.join(tags)}\n\n"
                    )


                summary = details.get(
                    "summary"
                )

                if summary:

                    f.write(
                        f"**Summary:** {summary}\n\n"
                    )


                operation_id = details.get(
                    "operationId"
                )

                if operation_id:

                    f.write(
                        f"**Operation ID:** `{operation_id}`\n\n"
                    )


                params = details.get(
                    "parameters",
                    []
                )

                if params:

                    f.write(
                        "### Parameters\n\n"
                    )

                    for param in params:

                        f.write(
                            f"- `{param.get('name')}` "
                            f"({param.get('in')})\n"
                        )

                    f.write("\n")


                request_body = details.get(
                    "requestBody"
                )

                if request_body:

                    f.write(
                        "### Request Body\n\n"
                    )

                    content = request_body.get(
                        "content",
                        {}
                    )

                    for content_type in content:

                        f.write(
                            f"- {content_type}\n"
                        )

                    f.write("\n")


                responses = details.get(
                    "responses",
                    {}
                )


                f.write(
                    "### Responses\n\n"
                )


                for code, response in responses.items():

                    description = response.get(
                        "description",
                        ""
                    )

                    f.write(
                        f"- `{code}` {description}\n"
                    )


                f.write(
                    "\n---\n\n"
                )


    print("")
    print("SUCCESS")
    print(
        "Created:"
    )
    print(
        OUTPUT_FILE
    )


if __name__ == "__main__":

    main()
