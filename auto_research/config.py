"""Configuration for the auto-research QA agent training pipeline."""

import os
from pathlib import Path

from dotenv import load_dotenv

load_dotenv(Path(__file__).parent.parent / ".env")

# Paths
PROJECT_ROOT = Path(__file__).parent.parent
AUTO_RESEARCH_ROOT = Path(__file__).parent
BENCHMARK_MD = PROJECT_ROOT / "BENCHMARK.md"
SOURCE_FILES = {
    "index.html": PROJECT_ROOT / "index.html",
    "style.css": PROJECT_ROOT / "style.css",
    "js/app.js": PROJECT_ROOT / "js" / "app.js",
    "js/store.js": PROJECT_ROOT / "js" / "store.js",
    "js/render.js": PROJECT_ROOT / "js" / "render.js",
    "js/data.js": PROJECT_ROOT / "js" / "data.js",
}

# Ground truth
BUGS_JSON = AUTO_RESEARCH_ROOT / "ground_truth" / "bugs.json"

# Agent prompts
PROMPTS_DIR = AUTO_RESEARCH_ROOT / "agents" / "prompts"

# Results
RESULTS_DIR = AUTO_RESEARCH_ROOT / "results"

# Exports
EXPORTS_DIR = AUTO_RESEARCH_ROOT / "exports"

# LLM Provider: "deepinfra" or "codex"
LLM_PROVIDER = os.environ.get("AUTO_RESEARCH_LLM_PROVIDER", "deepinfra").strip().lower()

# DeepInfra settings (used when LLM_PROVIDER=deepinfra)
DEEPINFRA_API_KEY = os.environ.get("DEEPINFRA_API_KEY", "").strip()
DEEPINFRA_BASE_URL = os.environ.get(
    "DEEPINFRA_BASE_URL", "https://api.deepinfra.com/v1/openai"
).strip()
DEEPINFRA_TIMEOUT_SECONDS = int(os.environ.get("DEEPINFRA_TIMEOUT_SECONDS", "900"))

# Codex API settings (used when LLM_PROVIDER=codex)
CODEX_BASE_URL = os.environ.get("CODEX_BASE_URL", "https://chatgpt.com/backend-api/codex")
CODEX_TIMEOUT_SECONDS = int(os.environ.get("CODEX_TIMEOUT_SECONDS", "900"))

# Model defaults — adapt to provider
_DEFAULT_MODEL = {
    "deepinfra": "meta-llama/Llama-3.3-70B-Instruct",
    "codex": "gpt-5.4",
}.get(LLM_PROVIDER, "meta-llama/Llama-3.3-70B-Instruct")

ITERATION_MODEL = os.environ.get("AUTO_RESEARCH_ITERATION_MODEL", _DEFAULT_MODEL)
VALIDATION_MODEL = os.environ.get("AUTO_RESEARCH_VALIDATION_MODEL", _DEFAULT_MODEL)
OPTIMIZER_MODEL = os.environ.get("AUTO_RESEARCH_OPTIMIZER_MODEL", _DEFAULT_MODEL)
DEFAULT_RUN_MODE = os.environ.get("AUTO_RESEARCH_RUN_MODE", "browser-use").strip().lower()
DEFAULT_APP_URL = os.environ.get("AUTO_RESEARCH_APP_URL", "").strip()
DEFAULT_BROWSER_PORT = int(os.environ.get("AUTO_RESEARCH_BROWSER_PORT", "3013"))
PLAYWRIGHT_TIMEOUT_SECONDS = int(os.environ.get("AUTO_RESEARCH_PLAYWRIGHT_TIMEOUT_SECONDS", "180"))
BROWSER_ROUTE_LIMIT = int(os.environ.get("AUTO_RESEARCH_BROWSER_ROUTE_LIMIT", "12"))
NODE_EXECUTABLE = os.environ.get("AUTO_RESEARCH_NODE_EXECUTABLE", "node")

# Browser-use agent settings
_DEFAULT_BROWSER_PROVIDER = "deepinfra" if LLM_PROVIDER == "deepinfra" else "openai"

BROWSER_USE_LLM_PROVIDER = os.environ.get("BROWSER_USE_LLM_PROVIDER", _DEFAULT_BROWSER_PROVIDER).strip().lower()
BROWSER_USE_LLM_MODEL = os.environ.get("BROWSER_USE_LLM_MODEL", ITERATION_MODEL).strip()
BROWSER_USE_HEADLESS = os.environ.get("BROWSER_USE_HEADLESS", "true").strip().lower() == "true"
BROWSER_USE_USE_VISION = os.environ.get("BROWSER_USE_USE_VISION", "true").strip().lower() == "true"
BROWSER_USE_MAX_STEPS = int(os.environ.get("BROWSER_USE_MAX_STEPS", "50"))
BROWSER_USE_CDP_URL = os.environ.get("BROWSER_USE_CDP_URL", "http://127.0.0.1:9222").strip()
BROWSER_USE_REMOTE_DEBUGGING_PORT = int(
    os.environ.get("BROWSER_USE_REMOTE_DEBUGGING_PORT", "9222")
)
BROWSER_USE_CHROMIUM_EXECUTABLE = os.environ.get(
    "BROWSER_USE_CHROMIUM_EXECUTABLE", ""
).strip()
BROWSER_USE_CONFIG_DIR = Path(
    os.environ.get("BROWSER_USE_CONFIG_DIR", str(PROJECT_ROOT / ".browseruse"))
)
BROWSER_USE_OAUTH2_TOKEN_FILE = (
    os.environ.get("BROWSER_USE_OAUTH2_TOKEN_FILE", "true").strip().lower() == "true"
)

# Iteration settings
MAX_ITERATIONS = 5
MIN_F1_IMPROVEMENT = 0.01
NO_IMPROVEMENT_PATIENCE = 3

# Specialist skills
AGENT_TYPES = [
    "happy_path",
    "edge_case",
    "accessibility",
    "error_recovery",
    "viewport",
    "security",
]

REVIEWER_TYPE = "reviewer"
SKILL_TYPES = [*AGENT_TYPES, REVIEWER_TYPE]
