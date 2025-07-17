# backend/core/llm_client.py

import json
import logging
from typing import List, Dict, Any, Optional

import openai
from pydantic import BaseModel, Field

# Correctly import the settings instance from its absolute path
from backend.core.config import settings

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# --- Pydantic Models for Structured LLM Output ---

class RankingResult(BaseModel):
    """
    Defines the structure for a single ranking result from the LLM.
    The model expects a title for the ranking and a numerical score.
    """
    title: str = Field(..., description="The title of the metric being ranked.")
    score: float = Field(..., description="The numerical score (e.g., from 1 to 10).")

class AgentResult(BaseModel):
    """
    Defines the overall structure of an agent's analysis result.
    It includes the agent's name, a textual report, and an optional list of rankings.
    """
    name: str = Field(..., description="The name of the agent that performed the analysis.")
    report: str = Field(..., description="The detailed textual report from the agent.")
    rankings: Optional[List[RankingResult]] = Field(None, description="An optional list of structured ranking results.")


# --- LLM Client for OpenAI API Interaction ---

class LLMClient:
    """
    A client to interact with an OpenAI-compatible Large Language Model.

    This class wraps the openai library to provide a dedicated method for
    running an agent's analysis. It handles prompt construction, API calls,
    and response parsing.
    """

    def __init__(self, api_base: str, api_key: str):
        """
        Initializes the LLMClient with the necessary API credentials.

        Args:
            api_base (str): The base URL of the OpenAI-compatible API.
            api_key (str): The API key for authentication.
        """
        self.api_base = api_base
        self.api_key = api_key
        # Note: The openai library uses global configuration. Setting these properties
        # here configures it for all subsequent calls within this application instance.
        openai.api_base = self.api_base
        openai.api_key = self.api_key
        logger.info(f"LLMClient initialized for API base: {self.api_base}")

    async def analyze_agent(
        self,
        name: str,
        prompt: str,
        documents: List[Dict[str, Any]],
        context: Optional[str] = None
    ) -> AgentResult:
        """
        Performs analysis by sending data to the LLM and parsing the result.

        Args:
            name (str): The name of the agent performing the analysis.
            prompt (str): The system prompt that defines the agent's task.
            documents (List[Dict[str, Any]]): A list of documents to be analyzed.
                                              Each dict should have 'filename' and 'text'.
            context (Optional[str]): Optional user-provided context for the analysis.

        Returns:
            AgentResult: A Pydantic model containing the structured analysis results.

        Raises:
            ValueError: If the LLM response is not valid JSON or doesn't match the
                        expected structure.
        """
        logger.info(f"Starting analysis for agent: {name}")

        # Construct the user message payload as a JSON string for the LLM.
        # This ensures all context and documents are passed cleanly.
        user_payload = {
            "documents": documents,
            "overall_goal": context or "No overall goal provided.",
        }

        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": json.dumps(user_payload, indent=2)},
        ]

        try:
            # Asynchronously call the chat completions endpoint.
            # We explicitly request JSON output from compatible models.
            response = await openai.ChatCompletion.acreate(
                model="gpt-4o",  # Or another suitable model
                messages=messages,
                response_format={"type": "json_object"},
                temperature=0.5,
            )

            raw_response = response.choices[0].message.content
            logger.info(f"Received raw response from LLM for agent '{name}': {raw_response}")

            # Parse the JSON response from the model.
            parsed_json = json.loads(raw_response)

            # Validate and construct the AgentResult Pydantic model.
            # This ensures the data conforms to our defined structure.
            return AgentResult(
                name=name,
                report=parsed_json.get("report", "No report was generated."),
                rankings=parsed_json.get("rankings", [])
            )

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed for agent '{name}': {e}\\nRaw response: {raw_response}")
            raise ValueError("The model did not return valid JSON.")
        except (KeyError, TypeError) as e:
            logger.error(f"Data structure validation failed for agent '{name}': {e}\\nParsed JSON: {parsed_json}")
            raise ValueError("The model's JSON response did not match the expected structure.")
        except Exception as e:
            logger.error(f"An unexpected error occurred during analysis for agent '{name}': {e}")
            raise
