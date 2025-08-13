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
