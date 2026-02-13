import logging
import os
from typing import Annotated

from fastapi import Depends
from openai import AsyncOpenAI
from openai.types.chat import ChatCompletionUserMessageParam
from starlette.requests import Request

from company_structure_api.db import CompaniesHouseDB
from company_structure_api.models import Company
from company_structure_api.config import Settings

def openai_client(config: Settings) -> AsyncOpenAI:
    if config.custom_openai_api_key_header is not None:
        return AsyncOpenAI(
            base_url=config.openai_base_url,
            api_key='',  # Empty string prevents Authorization header
            default_headers={
                config.custom_openai_api_key_header: f'Bearer {config.openai_api_key}'
            }
        )
    else:
        return AsyncOpenAI(
            base_url=config.openai_base_url,
            api_key=config.openai_api_key,
        )

logger = logging.getLogger(__name__)

RECOMMEND_BEST_MATCH_PROMPT = '''
Given a search query for a company and a list of potential matches from a database, please choose the best match.

Search Query: "{query}"

Potential Matches:
{matches}

Respond with the company number of the best match. Only return the company number, with no additional commentary or formatting.
'''

class CompanyVisualizer:
    def __init__(self, config: Settings, db: CompaniesHouseDB):
        self.config = config
        self.openai_client = openai_client(config)
        self.db = db

    def __enter__(self):
        return self

    def __exit__(self, exc_type, exc_val, exc_tb):
        self.close()

    async def recommend_best_match(self, query: str, matches: list[Company]) -> str | None:
        """
        Sends a query and a list of matches to the LLM and asks it to recommend the best match.

        Args:
            query: The original search query.
            matches: A list of potential company matches.

        Returns:
            The company number of the recommended match, or None if the model returns no content.
        """

        # Format the matches for the prompt
        formatted_matches = "\n".join([f"- {match.company_number}: {match.company_name}" for match in matches])

        prompt = RECOMMEND_BEST_MATCH_PROMPT.format(query=query, matches=formatted_matches)

        try:
            response = await self.openai_client.chat.completions.create(
                model=self.config.openai_model_name,
                messages=[ChatCompletionUserMessageParam(role="user", content=prompt)],
                max_tokens=20,
            )
            recommended_company_number = response.choices[0].message.content
            logger.info(f"Successfully received recommendation from LLM: {recommended_company_number}")
            return recommended_company_number.strip()
        except Exception as e:
            logger.error(f"An error occurred while communicating with the LLM: {e}", exc_info=True)
            raise

    def close(self):
        self.openai_client.close()
        self.db.disconnect()

def company_visualizer(request: Request) -> CompanyVisualizer:
    return request.app.state.company_visualizer

InjectedCompanyVisualizer = Annotated[CompanyVisualizer, Depends(company_visualizer)]