# First, you need to install the required libraries.
# Run this command in a cell, or in your terminal:
# !pip install rapidfuzz pandas duckdb psutil

import duckdb
import os
import sys
import time
from rapidfuzz import process, fuzz
import psutil  # For measuring memory usage

# --- Configuration ---
DB_FILENAME = "companies_house.db"
TABLE_NAME = "companies"
# List of terms to search for
SEARCH_TERMS = [
    "BRITTISH BROADCASTING CORP",  # Typo to test
    "TESLA UK MOTORS",
    "GOOGLE UK LIMTED",  # Typo to test
    "ROYAL MAIL",
    "GRAPHICS"
]

# --- IMPORTANT FOR OFFLINE USE ---
# Update this path to point to your downloaded fts extension file.
FTS_EXTENSION_PATH = "./fts.duckdb_extension"


def run_fts_search(db_file, table_name, search_terms, extension_path):
    """Runs and times searches using the DuckDB FTS extension."""
    print("Method: Searching inside DuckDB using the FTS extension.")
    print("Memory Usage: Low (data is processed within the database engine).")

    if not os.path.exists(extension_path):
        print(f"Error: FTS Extension not found at '{extension_path}'.", file=sys.stderr)
        return

    con = duckdb.connect(database=db_file, read_only=False)
    try:
        print(f"\nLoading FTS extension from '{extension_path}'...")
        con.execute(f"LOAD '{extension_path}';")

        print("Creating FTS index (if not exists)...")
        fts_query = f"PRAGMA create_fts_index('{table_name}', 'CompanyNumber', 'CompanyName', overwrite=1);"
        con.execute(fts_query)
        print("FTS index is ready.")

        fts_schema = f"fts_main_{table_name}"

        for search_name in search_terms:
            print("-" * 50)
            print(f"Searching for: '{search_name}'")
            query = f"""
            SELECT CompanyName, score FROM (
                SELECT CompanyName, {fts_schema}.match_bm25(CompanyNumber, ?) AS score
                FROM {table_name}
            ) sq WHERE score IS NOT NULL ORDER BY score DESC LIMIT 5;
            """

            start_time = time.time()
            results_df = con.execute(query, [search_name]).fetchdf()
            duration = time.time() - start_time

            print(f"--> Top 5 matches found in {duration:.4f} seconds:")
            print(results_df)

    except duckdb.Error as e:
        print(f"An error occurred: {e}", file=sys.stderr)
    finally:
        con.close()
        print("\nDatabase connection closed.")


def run_rapidfuzz_search(db_file, table_name, search_terms):
    """Runs and times searches using the in-memory RapidFuzz library."""
    print("Method: Loading all data into Python memory and using RapidFuzz.")

    con = duckdb.connect(database=db_file, read_only=True)
    try:
        # --- 1. Measure memory and load all company names ---
        py_process = psutil.Process(os.getpid())
        mem_before_load = py_process.memory_info().rss / (1024 * 1024)  # in MB

        print(f"\nLoading all company names from '{table_name}' into memory...")
        start_load_time = time.time()

        company_names_tuples = con.execute(
            f"SELECT CompanyName FROM {table_name}"
        ).fetchall()
        all_company_names = [item[0] for item in company_names_tuples if item[0]]

        load_duration = time.time() - start_load_time
        mem_after_load = py_process.memory_info().rss / (1024 * 1024)  # in MB
        mem_used = mem_after_load - mem_before_load

        print(
            f"Loaded {len(all_company_names):,} names in {load_duration:.2f} seconds."
        )
        print(f"Memory Usage: Increased by {mem_used:.2f} MB after loading names.")

        # --- 2. Iterate through search terms and find best matches ---
        for search_name in search_terms:
            print("-" * 50)
            print(f"Searching for: '{search_name}'")

            start_search_time = time.time()
            top_matches = process.extract(
                search_name, all_company_names, scorer=fuzz.WRatio, limit=5
            )
            search_duration = time.time() - start_search_time

            print(f"--> Top 5 matches found in {search_duration:.4f} seconds:")
            for match, score, index in top_matches:
                print(f"    - Score: {score:.2f}, Match: {match}")

    except duckdb.Error as e:
        print(f"An error occurred: {e}", file=sys.stderr)
    finally:
        con.close()
        print("\nDatabase connection closed.")


# --- Main execution block to run the comparison ---
if __name__ == "__main__":
    if not os.path.exists(DB_FILENAME):
        print(f"Error: Database file '{DB_FILENAME}' not found.", file=sys.stderr)
        print(
            "Please ensure you have run the data loading cell first.", file=sys.stderr
        )
    else:
        print("=" * 60)
        print("--- TEST 1: DuckDB Full-Text Search (FTS) ---")
        print("=" * 60)
        run_fts_search(DB_FILENAME, TABLE_NAME, SEARCH_TERMS, FTS_EXTENSION_PATH)

        print("\n\n" + "=" * 60)
        print("--- TEST 2: Python RapidFuzz (In-Memory) ---")
        print("=" * 60)
        run_rapidfuzz_search(DB_FILENAME, TABLE_NAME, SEARCH_TERMS)
