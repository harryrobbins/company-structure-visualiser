"""
companies_house_db

A Python package to download UK Companies House data into a searchable
DuckDB database with FTS.
"""

__version__ = "0.1.0"
__author__ = "Your Name"
__credits__ = "Your Credits"

# Expose the main class at the package level
from .core import CompaniesHouseDB
