"""
Anthropic Claude AI client for generating summaries.
"""

import json
import logging
from django.conf import settings
import re

logger = logging.getLogger(__name__)

try:
    import anthropic

    HAS_ANTHROPIC = True
except ImportError:
    HAS_ANTHROPIC = False
    logger.warning("Anthropic SDK not installed. AI features will be disabled.")


def extract_and_parse_json(text: str):
    """
    Extracts the first valid JSON object/array from a string and parses it.

    Args:
        text (str): The input string containing JSON.

    Returns:
        dict | list: Parsed JSON object/array if found.
        None: If no valid JSON is found.
    """
    # Regex to find JSON objects or arrays
    json_pattern = r"(\{.*\}|\[.*\])"
    matches = re.findall(json_pattern, text, re.DOTALL)

    for match in matches:
        try:
            return json.loads(match)  # return first valid JSON found
        except json.JSONDecodeError:
            continue

    return None


class AIClient:
    """Client for interacting with Claude AI."""

    def __init__(self):
        if not HAS_ANTHROPIC:
            raise RuntimeError("Anthropic SDK is not installed")

        api_key = settings.ANTHROPIC_API_KEY
        if not api_key:
            raise ValueError("ANTHROPIC_API_KEY is not configured")

        self.client = anthropic.Anthropic(api_key=api_key)
        # Use Haiku for individual summaries (cheaper), Sonnet for overall (better quality)
        self.model_fast = "claude-haiku-4-5-20251001"
        self.model_quality = "claude-sonnet-4-5-20250929"

    def generate_commit_group_summary(
        self,
        commits: list[dict],
        pull_requests: list[dict],
        issues: list[dict],
        start_date: str,
        end_date: str,
    ) -> dict:
        """
        Generate a summary for a group of commits.

        Returns a dict with:
        - summary: str
        - key_changes: list[str]
        - notable_features: list[str]
        - bug_fixes: list[str]
        - technical_decisions: list[str]
        - main_contributors: list[str]
        """
        # Format commits for prompt
        commits_text = "\n".join(
            [
                f"- {c['sha'][:7]}: {c['message'][:200]} (by {c['author']})"
                for c in commits[:50]  # Limit to 50 commits
            ]
        )

        # Format PRs for prompt
        prs_text = (
            "\n".join(
                [
                    f"- PR #{pr['number']}: {pr['title']} ({pr['state']}) by {pr['author']}"
                    for pr in pull_requests[:20]
                ]
            )
            if pull_requests
            else "No pull requests in this period"
        )

        # Format issues for prompt
        issues_text = (
            "\n".join(
                [
                    f"- Issue #{issue['number']}: {issue['title']} ({issue['state']})"
                    for issue in issues[:20]
                ]
            )
            if issues
            else "No issues in this period"
        )

        prompt = f"""Analyze this group of commits from {start_date} to {end_date}:

## Commits ({len(commits)} total):
{commits_text}

## Related Pull Requests:
{prs_text}

## Related Issues:
{issues_text}

Provide a structured analysis. Respond with valid JSON only, no markdown:
{{
  "summary": "Brief 2-3 sentence summary of what was accomplished",
  "key_changes": ["change 1", "change 2", ...],
  "notable_features": ["feature 1", ...],
  "bug_fixes": ["fix 1", ...],
  "technical_decisions": ["decision 1", ...],
  "main_contributors": ["username1", "username2", ...]
}}

Keep each list to max 5 items. Focus on the most important changes."""

        try:
            response = self.client.messages.create(
                model=self.model_fast,
                max_tokens=10000,
                messages=[{"role": "user", "content": prompt}],
            )

            content = response.content[0].text
            # Parse JSON response
            result = extract_and_parse_json(content)
            return result

        except json.JSONDecodeError as e:
            logger.error(f"Failed to parse AI response as JSON: {e}")
            return {
                "summary": "Summary generation failed - invalid response format",
                "key_changes": [],
                "notable_features": [],
                "bug_fixes": [],
                "technical_decisions": [],
                "main_contributors": [],
            }
        except Exception as e:
            logger.error(f"AI API error: {e}")
            return {
                "summary": f"Summary generation failed: {str(e)}",
                "key_changes": [],
                "notable_features": [],
                "bug_fixes": [],
                "technical_decisions": [],
                "main_contributors": [],
            }

    def generate_overall_summary(
        self,
        repo_name: str,
        total_commits: int,
        total_contributors: int,
        total_prs: int,
        total_issues: int,
        commit_group_summaries: list[dict],
        top_contributors: list[dict],
        period_start: str,
        period_end: str,
    ) -> str:
        """
        Generate an overall summary for the repository.

        Returns a comprehensive summary string.
        """
        # Format commit group summaries
        groups_text = "\n\n".join(
            [
                f"### {g['period']}\n{g['summary']}"
                for g in commit_group_summaries[
                    :12
                ]  # Limit to 12 groups (e.g., 12 weeks)
            ]
        )

        # Format top contributors
        contributors_text = "\n".join(
            [
                f"- {c['username']}: {c['commits']} commits, impact score: {c['impact_score']}"
                for c in top_contributors[:10]
            ]
        )

        prompt = f"""Generate a comprehensive summary for the GitHub repository: {repo_name}

## Repository Statistics:
- Total Commits: {total_commits}
- Total Contributors: {total_contributors}
- Pull Requests: {total_prs}
- Issues: {total_issues}
- Analysis Period: {period_start} to {period_end}

## Period Summaries:
{groups_text}

## Top Contributors:
{contributors_text}

Write a comprehensive but concise summary (3-5 paragraphs) that covers:
1. The main purpose and focus of recent development
2. Key features and improvements made
3. Notable bug fixes and technical decisions
4. Team dynamics and contributor highlights
5. Overall project health and momentum

Write in a professional, informative tone. Focus on insights that would help someone understand the project's evolution."""

        try:
            response = self.client.messages.create(
                model=self.model_fast,
                max_tokens=10000,
                messages=[{"role": "user", "content": prompt}],
            )

            return response.content[0].text

        except Exception as e:
            logger.error(f"AI API error for overall summary: {e}")
            return f"Overall summary generation failed: {str(e)}"

    def calculate_impact_score(
        self,
        commits: int,
        additions: int,
        deletions: int,
        prs_merged: int,
        prs_opened: int,
        issues_closed: int,
        issues_opened: int,
    ) -> int:
        """
        Calculate a contributor's impact score based on their activity.

        Scoring:
        - Each commit: 10 points
        - Each line added: 0.1 point (max 500 from additions)
        - Each line deleted: 0.05 point (max 250 from deletions)
        - Each PR merged: 50 points
        - Each PR opened: 20 points
        - Each issue closed: 30 points
        - Each issue opened: 10 points
        """
        score = 0
        score += commits * 10
        score += min(additions * 0.1, 500)
        score += min(deletions * 0.05, 250)
        score += prs_merged * 50
        score += prs_opened * 20
        score += issues_closed * 30
        score += issues_opened * 10

        return int(score)
