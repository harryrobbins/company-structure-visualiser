# backend/core/llm_client.py

import json
import logging
from typing import List, Dict, Any, Optional

# FIX: Import the new client classes from the openai library
from openai import AsyncOpenAI, OpenAIError
from pydantic import BaseModel, Field, ValidationError

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

# FIX: Create a model representing only what the LLM should generate.
# This schema will be provided to the model.
class LLMOutput(BaseModel):
    """
    The data structure that the language model is expected to generate.
    """
    report: str = Field(..., description="The detailed textual report from the agent.")
    # FIX: Default to an empty list if the 'rankings' key is missing from the LLM response.
    # This prevents 'null' values from being sent to the frontend.
    rankings: List[RankingResult] = Field(default_factory=list, description="An optional list of structured ranking results.")

# This is the final data structure for the API response, combining the
# LLM's output with the agent's name.
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
        """
        self.client = AsyncOpenAI(
            base_url=api_base,
            api_key=api_key
        )
        logger.info(f"LLMClient initialized for API base: {api_base}")

    async def analyze_agent(
        self,
        name: str,
        prompt: str,
        documents: List[Dict[str, Any]],
        context: Optional[str] = None
    ) -> AgentResult:
        """
        Performs analysis by sending data to the LLM and parsing the result.
        """
        logger.info(f"Starting analysis for agent: {name}")

        user_payload = {
            "documents": documents,
            "overall_goal": context or "No overall goal provided.",
        }

        messages = [
            {"role": "system", "content": prompt},
            {"role": "user", "content": json.dumps(user_payload, indent=2)},
        ]

        arguments = ""
        try:
            # FIX: Use the 'tools' API for reliable structured output based on the LLMOutput Pydantic model.
            # This is the modern and recommended way to get structured JSON.
            response = await self.client.chat.completions.create(
                model="gpt-4o",  # Or another suitable model
                messages=messages,
                tools=[
                    {
                        "type": "function",
                        "function": {
                            "name": "save_analysis_result",
                            "description": "Saves the agent's analysis report and rankings.",
                            # Provide the JSON schema of the data structure we want.
                            "parameters": LLMOutput.model_json_schema()
                        },
                    }
                ],
                # Force the model to use our defined tool.
                tool_choice={"type": "function", "function": {"name": "save_analysis_result"}},
                temperature=0.5,
            )

            tool_call = response.choices[0].message.tool_calls[0]
            if tool_call.function.name == "save_analysis_result":
                arguments = tool_call.function.arguments
                logger.info(f"Received raw arguments from LLM for agent '{name}': {arguments}")

                # Parse and validate the JSON arguments using our Pydantic model.
                llm_output = LLMOutput.model_validate_json(arguments)

                # Construct the final AgentResult, combining the LLM output with the agent name.
                return AgentResult(name=name, **llm_output.model_dump())
            else:
                 raise ValueError("The model did not use the expected tool 'save_analysis_result'.")

        except json.JSONDecodeError as e:
            logger.error(f"JSON parsing failed for agent '{name}': {e}\nRaw arguments: {arguments}")
            raise ValueError("The model did not return valid JSON in its tool arguments.")
        except ValidationError as e:
            logger.error(f"Pydantic validation failed for agent '{name}': {e}\nRaw arguments: {arguments}")
            raise ValueError("The model's JSON response did not match the expected schema.")
        except (KeyError, TypeError, IndexError) as e:
            logger.error(f"Data structure access error for agent '{name}': {e}\nResponse object: {response.model_dump_json(indent=2)}")
            raise ValueError("The model's response did not match the expected structure for a tool call.")
        except OpenAIError as e:
            logger.error(f"OpenAI API error during analysis for agent '{name}': {e}")
            raise
        except Exception as e:
            logger.exception(f"An unexpected error occurred during analysis for agent '{name}': {e}")
            raise
