"""
SemiSharp Database Dictionary Generator V3.0

Creates:
    Documentation/database_dictionary.txt
    Documentation/database_dictionary.json

Captures:
    - schemas
    - tables
    - columns
    - primary keys
    - foreign keys
    - indexes
    - row counts
"""

import os
import json
from datetime import datetime

import psycopg2
from dotenv import load_dotenv


# -------------------------------------------------
# Paths
# -------------------------------------------------

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


OUTPUT_JSON = os.path.join(
    DOCS_DIR,
    "database_dictionary.json"
)

OUTPUT_TXT = os.path.join(
    DOCS_DIR,
    "database_dictionary.txt"
)


# -------------------------------------------------
# Environment
# -------------------------------------------------

load_dotenv(
    os.path.join(
        BACKEND_DIR,
        ".env"
    )
)


# -------------------------------------------------
# Connection
# -------------------------------------------------

def get_connection():

    return psycopg2.connect(
        host=os.getenv("DB_HOST"),
        port=os.getenv("DB_PORT"),
        database=os.getenv("DB_NAME"),
        user=os.getenv("DB_USER"),
        password=os.getenv("DB_PASSWORD")
    )


# -------------------------------------------------
# Metadata
# -------------------------------------------------

SYSTEM_SCHEMAS = (
    "pg_catalog",
    "information_schema"
)


def get_tables(cursor):

    cursor.execute("""
        SELECT
            table_schema,
            table_name
        FROM information_schema.tables
        WHERE table_schema NOT IN (
            'pg_catalog',
            'information_schema'
        )
        ORDER BY
            table_schema,
            table_name;
    """)

    return [
        {
            "schema": r[0],
            "table": r[1]
        }
        for r in cursor.fetchall()
    ]


def get_columns(cursor, schema, table):

    cursor.execute("""
        SELECT
            column_name,
            data_type,
            is_nullable
        FROM information_schema.columns
        WHERE table_schema=%s
        AND table_name=%s
        ORDER BY ordinal_position;
    """,
    (
        schema,
        table
    ))

    return [
        {
            "name": r[0],
            "type": r[1],
            "nullable": r[2]
        }
        for r in cursor.fetchall()
    ]


def get_primary_keys(cursor, schema, table):

    cursor.execute("""
        SELECT
            a.attname
        FROM
            pg_index i
        JOIN
            pg_attribute a
            ON a.attrelid=i.indrelid
            AND a.attnum = ANY(i.indkey)
        JOIN
            pg_class c
            ON c.oid=i.indrelid
        JOIN
            pg_namespace n
            ON n.oid=c.relnamespace
        WHERE
            i.indisprimary
        AND
            n.nspname=%s
        AND
            c.relname=%s;
    """,
    (
        schema,
        table
    ))

    return [
        r[0]
        for r in cursor.fetchall()
    ]


def get_foreign_keys(cursor, schema, table):

    cursor.execute("""
        SELECT
            kcu.column_name,
            ccu.table_schema,
            ccu.table_name,
            ccu.column_name
        FROM
            information_schema.table_constraints tc
        JOIN
            information_schema.key_column_usage kcu
            ON tc.constraint_name=kcu.constraint_name
        JOIN
            information_schema.constraint_column_usage ccu
            ON ccu.constraint_name=tc.constraint_name
        WHERE
            tc.constraint_type='FOREIGN KEY'
        AND
            tc.table_schema=%s
        AND
            tc.table_name=%s;
    """,
    (
        schema,
        table
    ))

    return [
        {
            "column": r[0],
            "references_schema": r[1],
            "references_table": r[2],
            "references_column": r[3]
        }
        for r in cursor.fetchall()
    ]


def get_indexes(cursor, schema, table):

    cursor.execute("""
        SELECT
            indexname
        FROM
            pg_indexes
        WHERE
            schemaname=%s
        AND
            tablename=%s;
    """,
    (
        schema,
        table
    ))

    return [
        r[0]
        for r in cursor.fetchall()
    ]


def get_row_count(cursor, schema, table):

    cursor.execute(
        f'SELECT COUNT(*) FROM "{schema}"."{table}"'
    )

    return cursor.fetchone()[0]


# -------------------------------------------------
# Generate
# -------------------------------------------------

def main():

    print("Connecting to database...")

    conn = get_connection()

    cursor = conn.cursor()


    dictionary = {

        "generated": str(datetime.now()),

        "database": os.getenv(
            "DB_NAME"
        ),

        "tables": []

    }


    tables = get_tables(cursor)


    print(
        f"Found {len(tables)} tables"
    )


    for item in tables:

        schema = item["schema"]
        table = item["table"]

        print(
            f"{schema}.{table}"
        )


        dictionary["tables"].append({

            "schema": schema,

            "table": table,

            "row_count":
                get_row_count(
                    cursor,
                    schema,
                    table
                ),

            "columns":
                get_columns(
                    cursor,
                    schema,
                    table
                ),

            "primary_keys":
                get_primary_keys(
                    cursor,
                    schema,
                    table
                ),

            "foreign_keys":
                get_foreign_keys(
                    cursor,
                    schema,
                    table
                ),

            "indexes":
                get_indexes(
                    cursor,
                    schema,
                    table
                )

        })


    cursor.close()
    conn.close()


    with open(
        OUTPUT_JSON,
        "w"
    ) as f:

        json.dump(
            dictionary,
            f,
            indent=2
        )


    with open(
        OUTPUT_TXT,
        "w"
    ) as f:

        f.write(
            "SemiSharp Database Dictionary V3.0\n"
        )

        f.write(
            "=" * 80 + "\n"
        )

        f.write(
            f"Generated: {dictionary['generated']}\n"
        )

        f.write(
            f"Database: {dictionary['database']}\n"
        )


        for t in dictionary["tables"]:

            f.write("\n\n")
            f.write("=" * 80 + "\n")

            f.write(
                f"SCHEMA: {t['schema']}\n"
            )

            f.write(
                f"TABLE: {t['table']}\n"
            )

            f.write("=" * 80 + "\n")

            f.write(
                f"\nRows: {t['row_count']}\n"
            )

            f.write("\nColumns:\n")

            for c in t["columns"]:

                f.write(
                    f"  {c['name']:<30}"
                    f"{c['type']:<20}"
                    f"nullable={c['nullable']}\n"
                )


            f.write("\nPrimary Keys:\n")

            for pk in t["primary_keys"]:
                f.write(
                    f"  {pk}\n"
                )


            f.write("\nForeign Keys:\n")

            for fk in t["foreign_keys"]:

                f.write(
                    f"  {fk['column']} -> "
                    f"{fk['references_schema']}."
                    f"{fk['references_table']}."
                    f"{fk['references_column']}\n"
                )


            f.write("\nIndexes:\n")

            for idx in t["indexes"]:

                f.write(
                    f"  {idx}\n"
                )


    print("\nSUCCESS")
    print(OUTPUT_TXT)
    print(OUTPUT_JSON)


if __name__ == "__main__":
    main()
