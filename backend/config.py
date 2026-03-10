import os
from dotenv import load_dotenv

load_dotenv(".env.local")

# Premium — server keys used in dev; users provide their own in prod
ANTHROPIC_API_KEY = os.getenv("ANTHROPIC_API_KEY", "")
OPENAI_API_KEY    = os.getenv("OPENAI_API_KEY", "")
GOOGLE_API_KEY    = os.getenv("GOOGLE_API_KEY", "")
GROK_API_KEY      = os.getenv("GROK_API_KEY", "")

# Free tier — server always provides these keys
GROQ_API_KEY    = os.getenv("GROQ_API_KEY", "")
MISTRAL_API_KEY = os.getenv("MISTRAL_API_KEY", "")

# Model selection (override via .env.local if desired)
CLAUDE_MODEL  = os.getenv("CLAUDE_MODEL",  "claude-3-5-haiku-20241022")
OPENAI_MODEL  = os.getenv("OPENAI_MODEL",  "gpt-4o-mini")
GEMINI_MODEL  = os.getenv("GEMINI_MODEL",  "gemini-2.0-flash")
GROK_MODEL    = os.getenv("GROK_MODEL",    "grok-2-latest")
GROQ_MODEL    = os.getenv("GROQ_MODEL",    "llama-3.3-70b-versatile")
MISTRAL_MODEL = os.getenv("MISTRAL_MODEL", "mistral-small-latest")
