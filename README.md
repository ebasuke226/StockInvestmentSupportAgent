# StockInvestmentSupportAgent

This repository contains a minimal React frontend and FastAPI backend.

## Development with Docker

Ensure you have **Docker** and **Docker Compose** installed. Build and run the containers with:

```bash
docker compose up --build
```

The React app will be served at [http://localhost:3000](http://localhost:3000) and the FastAPI API at [http://localhost:8000](http://localhost:8000).

## Directory Structure

```
frontend/   # React + TypeScript client
backend/    # FastAPI server
tests/      # automated tests
scripts/    # helper scripts for AI tasks
docker-compose.yml
README.md
```

## React Component Organization

Components follow the [Atomic Design](https://bradfrost.com/blog/post/atomic-web-design/) methodology:

- **Atoms** are the smallest reusable elements (buttons, inputs).
- **Molecules** group atoms to form simple components (forms, cards).
- **Organisms** compose molecules into more complex sections.
- **Templates** provide page level layouts.
- **Pages** fill templates with real data.

Place components in `frontend/src/components/<atom|molecule|organism|...>`.

## Coding Style Conventions

### Frontend (TypeScript/React)
- Use **ESLint** and **Prettier** to enforce consistent formatting.
- Prefer functional components and hooks.
- Keep files typed with TypeScript.

### Backend (FastAPI)
- Format Python code with **black** and **isort**.
- Define request/response models using Pydantic.
- Write asynchronous endpoints when possible.

## Generative AI Assisted Workflows

You can use generative AI to produce tests and user personas. Example placeholders are included in the `scripts/` folder.

```bash
# Generate sample tests
./scripts/generate_tests.sh

# Generate example user personas
./scripts/generate_personas.sh
```

The scripts should call your preferred AI API (for example OpenAI) and save the output into the `tests/` directory.

