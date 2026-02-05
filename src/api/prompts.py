# api/prompts.py

"""
This module centralizes all prompts used for interacting with the LLM.
Separating prompts from the application logic makes them easier to manage,
version, and test.
"""

# Prompt for extracting text from an image of a document page.
# It instructs the model to return only the text content.
EXTRACT_TEXT_PROMPT = """
Extract all text from this image. Only return the text content, with no additional commentary or formatting.
"""

RECOMMEND_BEST_MATCH_PROMPT = '''
Given a search query for a company and a list of potential matches from a database, please choose the best match.

Search Query: "{query}"

Potential Matches:
{matches}

Respond with the company number of the best match. Only return the company number, with no additional commentary or formatting.
'''
