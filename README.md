# CommitSaga

> Every repository tells a story through its commits. CommitSaga helps you read and understand that saga.

## What is CommitSaga?

CommitSaga is a comprehensive git repository analysis tool that transforms your repository history into meaningful insights. It analyzes commits, pull requests, and issues to help developers understand code evolution, past decisions, and contributor impact.

## Key Features

- **AI-Powered Analysis**: Uses Claude AI to generate intelligent summaries of commit groups, PRs, and issues
- **Contributor Gamification**: Impact scoring system that recognizes and ranks contributor efforts
- **Issue Archaeology**: Discover past problems and their solutions - valuable learning for new developers
- **Timeline Visualization**: Interactive visualizations showing how your codebase evolved over time
- **AI-Friendly Exports**: Generate structured markdown exports (weekly/monthly/complete) optimized for LLM consumption
- **Automated Updates**: Set up cron jobs to automatically analyze new commits on a schedule

## Tech Stack

**Backend:**
- Django 5.x + Django REST Framework
- PostgreSQL
- Celery + Redis
- PyGithub
- Anthropic Python SDK

**Frontend:**
- Next.js 16 (App Router)
- Bun runtime
- TailwindCSS
- Recharts for visualizations

## Use Cases

1. **Onboarding New Developers**: Help new team members understand the codebase evolution and past architectural decisions
2. **Knowledge Preservation**: Capture and preserve context around why code exists and what problems it solved
3. **Learning from History**: Avoid repeating past mistakes by understanding what was tried before
4. **Team Recognition**: Gamified contributor scoring to recognize and celebrate team member contributions
5. **AI Context**: Export repository history in AI-consumable format for feeding to LLMs for further analysis

## Project Structure

```
commitsaga/
├── backend/          # Django backend
├── frontend/         # Next.js frontend
├── PLAN.md          # Detailed implementation plan
└── README.md        # This file
```

## Getting Started

See [PLAN.md](./PLAN.md) for the complete implementation plan and setup instructions.

## Implementation Status

This project is in the planning phase. Check PLAN.md for the detailed roadmap.

---

Built with love for developers who believe every commit tells a story.
