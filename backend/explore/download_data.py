import duckdb
import requests
import zipfile
import io
import os
import sys
import pandas as pd
import matplotlib.pyplot as plt
import seaborn as sns


def load_companies_house_data(
    zip_url, db_file="companies_house.db", table_name="companies"
):
    """
    Downloads, extracts, and loads the UK Companies House basic data into a DuckDB database.
    It also creates a Full-Text Search (FTS) index on the CompanyName.

    Args:
        zip_url (str): The URL to the Companies House data zip file.
        db_file (str): The local filename for the DuckDB database.
        table_name (str): The name of the table to create in the database.
    """
    temp_csv_path = "temp_company_data.csv"

    try:
        # --- 1. Download the ZIP file ---
        print(f"Downloading data from {zip_url}...")
        response = requests.get(zip_url, stream=True)
        response.raise_for_status()  # Raise an exception for bad status codes (4xx or 5xx)
        print("Download complete.")

        # --- 2. Find and extract the CSV from the ZIP in memory ---
        print("Extracting CSV file from the archive...")
        with zipfile.ZipFile(io.BytesIO(response.content)) as thezip:
            # Find the CSV file inside the zip archive
            csv_filename = None
            for filename in thezip.namelist():
                if filename.lower().endswith(".csv"):
                    csv_filename = filename
                    break

            if not csv_filename:
                print("Error: No CSV file found in the zip archive.", file=sys.stderr)
                return

            # Extract the CSV file to a temporary local file
            with open(temp_csv_path, "wb") as f_out:
                f_out.write(thezip.read(csv_filename))
            print(f"CSV file '{csv_filename}' extracted to '{temp_csv_path}'.")

        # --- 3. Load the data into DuckDB ---
        print(f"Connecting to DuckDB database: '{db_file}'...")
        con = duckdb.connect(database=db_file, read_only=False)

        print(f"Creating table '{table_name}' and loading data from CSV...")
        create_table_query = f"""
        CREATE OR REPLACE TABLE {table_name} AS 
        SELECT * FROM read_csv_auto('{temp_csv_path}', header=True);
        """
        con.execute(create_table_query)
        print("Data loaded successfully.")

        # --- 4. Create Full-Text Search (FTS) Index ---
        print("\nCreating Full-Text Search index on CompanyName...")
        con.execute("INSTALL fts;")
        con.execute("LOAD fts;")
        # We use CompanyNumber as the unique ID for the index
        # Overwrite is set to 1 so we can re-run the script without errors
        fts_query = f"""
        PRAGMA create_fts_index(
            '{table_name}', 'CompanyNumber', 'CompanyName', overwrite=1
        );
        """
        con.execute(fts_query)
        print("FTS index created successfully.")

        # --- 5. Verify the data ---
        print("\n--- Verification ---")
        total_rows = con.execute(f"SELECT COUNT(*) FROM {table_name}").fetchone()[0]
        print(f"Total rows in '{table_name}': {total_rows:,}")

        print(f"\nSample of 5 rows from the '{table_name}' table:")
        sample_df = con.execute(f"SELECT * FROM {table_name} LIMIT 5").fetchdf()
        print(sample_df)

        con.close()
        print("\nDatabase connection closed.")

    except requests.exceptions.RequestException as e:
        print(f"Error downloading the file: {e}", file=sys.stderr)
    except zipfile.BadZipFile:
        print("Error: The downloaded file is not a valid zip archive.", file=sys.stderr)
    except Exception as e:
        print(f"An unexpected error occurred: {e}", file=sys.stderr)
    finally:
        # --- 6. Clean up the temporary file ---
        if os.path.exists(temp_csv_path):
            os.remove(temp_csv_path)
            print(f"\nTemporary file '{temp_csv_path}' has been deleted.")


def inspect_and_visualise(db_file="companies_house.db", table_name="companies"):
    """
    Connects to the DuckDB database to inspect and visualise the company data.

    Args:
        db_file (str): The local filename for the DuckDB database.
        table_name (str): The name of the table to query.
    """
    if not os.path.exists(db_file):
        print(
            f"Database file '{db_file}' not found. Please run the load script first.",
            file=sys.stderr,
        )
        return

    print("\n--- Starting Data Inspection & Visualization ---")
    con = duckdb.connect(database=db_file, read_only=True)

    # --- 1. Inspect Schema and Basic Stats ---
    print("\nTable Schema:")
    schema = con.execute(f"PRAGMA table_info('{table_name}')").fetchdf()
    print(schema[["name", "type"]])

    print("\nCompany Category Distribution:")
    category_dist = con.execute(f"""
        SELECT CompanyCategory, COUNT(*) as Count 
        FROM {table_name} 
        GROUP BY CompanyCategory 
        ORDER BY Count DESC
    """).fetchdf()
    print(category_dist)

    print("\nCompany Status Distribution:")
    status_dist = con.execute(f"""
        SELECT CompanyStatus, COUNT(*) as Count 
        FROM {table_name} 
        GROUP BY CompanyStatus 
        ORDER BY Count DESC
    """).fetchdf()
    print(status_dist)

    # --- 2. Visualizations ---

    # Plot 1: Top 10 SIC Codes (Industry Classification)
    print("\nGenerating plot for Top 10 SIC Codes...")
    top_sic_codes = con.execute(f"""
        SELECT "SICCode.SicText_1" AS SicCode, COUNT(*) AS Count
        FROM {table_name}
        WHERE "SICCode.SicText_1" IS NOT NULL AND "SICCode.SicText_1" != 'None Supplied'
        GROUP BY SicCode
        ORDER BY Count DESC
        LIMIT 10
    """).fetchdf()

    plt.figure(figsize=(12, 8))
    sns.barplot(data=top_sic_codes, x="Count", y="SicCode", palette="viridis")
    plt.title("Top 10 Most Common SIC Codes (Primary Industry)", fontsize=16)
    plt.xlabel("Number of Companies", fontsize=12)
    plt.ylabel("SIC Code Description", fontsize=12)
    plt.tight_layout()
    plt.savefig("top_10_sic_codes.png")
    print("Plot saved to 'top_10_sic_codes.png'")
    # plt.show() # Uncomment to display plot interactively

    # Plot 2: Company Incorporations Over Time
    print("\nGenerating plot for Company Incorporations by Year...")
    incorporations_by_year = con.execute(f"""
        SELECT 
            EXTRACT(YEAR FROM TRY_CAST(IncorporationDate AS DATE)) AS IncorporationYear, 
            COUNT(*) as Count
        FROM {table_name}
        WHERE IncorporationYear BETWEEN 1980 AND EXTRACT(YEAR FROM NOW())
        GROUP BY IncorporationYear
        ORDER BY IncorporationYear
    """).fetchdf()

    plt.figure(figsize=(14, 7))
    sns.lineplot(
        data=incorporations_by_year, x="IncorporationYear", y="Count", marker="o"
    )
    plt.title("UK Company Incorporations Over Time (1980-Present)", fontsize=16)
    plt.xlabel("Year of Incorporation", fontsize=12)
    plt.ylabel("Number of Companies Incorporated", fontsize=12)
    plt.grid(True, which="both", linestyle="--", linewidth=0.5)
    plt.tight_layout()
    plt.savefig("incorporations_by_year.png")
    print("Plot saved to 'incorporations_by_year.png'")
    # plt.show() # Uncomment to display plot interactively

    con.close()
    print("\n--- Analysis Complete ---")


def find_closest_company(
    search_name, db_file="companies_house.db", table_name="companies"
):
    """
    Finds the closest company name match using the Full-Text Search (FTS) index.

    Args:
        search_name (str): The company name to search for.
        db_file (str): The local filename for the DuckDB database.
        table_name (str): The name of the table to query.
    """
    if not os.path.exists(db_file):
        print(
            f"Database file '{db_file}' not found. Please run the load script first.",
            file=sys.stderr,
        )
        return

    print(f"\nSearching for closest match to: '{search_name}' using FTS...")
    con = duckdb.connect(database=db_file, read_only=True)

    try:
        # The FTS extension must be loaded for each connection that uses it.
        con.execute("LOAD fts;")

        # The schema name for the FTS index is derived from the table name.
        fts_schema = f"fts_main_{table_name}"

        # We use the match_bm25 function to find and score matches.
        # A higher score is a better match.
        query = f"""
        SELECT CompanyName, score
        FROM (
            SELECT 
                CompanyName, 
                {fts_schema}.match_bm25(
                    CompanyNumber,
                    ?
                ) AS score
            FROM {table_name}
        ) sq
        WHERE score IS NOT NULL
        ORDER BY score DESC
        LIMIT 5;
        """

        results_df = con.execute(query, [search_name]).fetchdf()

        if not results_df.empty:
            print("--> Top 5 FTS matches found:")
            print(results_df)
        else:
            print("--> No matches found for the query.")

    except duckdb.Error as e:
        print(f"An error occurred during the FTS search: {e}", file=sys.stderr)
    finally:
        con.close()


if __name__ == "__main__":
    # URL for the Companies House data. Note: The date in the URL changes over time.
    # Please check for the latest URL from the Companies House website if this fails.
    COMPANIES_HOUSE_URL = "https://download.companieshouse.gov.uk/BasicCompanyDataAsOneFile-2025-09-01.zip"
    DB_FILENAME = "companies_house.db"

    # Step 1: Load the data and create the FTS index
    load_companies_house_data(COMPANIES_HOUSE_URL, db_file=DB_FILENAME)

    # Step 2: Inspect and visualise the data
    # Make sure you have the required libraries: pip install pandas matplotlib seaborn
    inspect_and_visualise(db_file=DB_FILENAME)

    # Step 3: Find a company using the fast FTS index
    print("\n--- Testing Company Search with FTS ---")
    # We use names with typos or variations to demonstrate the matching
    # Note: FTS is token-based, so it excels at finding words but may not handle
    # single-word misspellings like "LIMTED" as well as levenshtein.
    find_closest_company("GOOGLE UK LIMTED", db_file=DB_FILENAME)
    find_closest_company("TESLA UK MOTORS", db_file=DB_FILENAME)
    find_closest_company("BRITISH BROADCASTING CORP", db_file=DB_FILENAME)
