#!/usr/bin/env bash
# Builds both apps for GitHub Pages and assembles them into ./site:
#   /<repo>/                    developer portfolio
#   /<repo>/workflow-studio/    Workflow Studio
set -euo pipefail
OWNER="${PAGES_OWNER:-mahamaharati-lgtm}"
REPO="${PAGES_REPO:-Portfolio}"
ORIGIN="https://${OWNER}.github.io"
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

(cd "$ROOT/workflow-studio" && BASE_PATH="/${REPO}/workflow-studio/" npm run build)
(cd "$ROOT/developer-portfolio" && \
  BASE_PATH="/${REPO}/" \
  VITE_WORKFLOW_STUDIO_URL="${ORIGIN}/${REPO}/workflow-studio/" \
  SITE_URL="${ORIGIN}/${REPO}" \
  SPA_FALLBACK_PREFIX="/${REPO}/workflow-studio/" \
  npm run build)

rm -rf "$ROOT/site"
mkdir -p "$ROOT/site"
cp -R "$ROOT/developer-portfolio/dist/." "$ROOT/site/"
cp -R "$ROOT/workflow-studio/dist" "$ROOT/site/workflow-studio"
# Cloudflare-only files are not used by GitHub Pages.
rm -f "$ROOT/site/_redirects" "$ROOT/site/_headers" "$ROOT/site/workflow-studio/_redirects" "$ROOT/site/workflow-studio/_headers"
touch "$ROOT/site/.nojekyll"
echo "Assembled site/ for ${ORIGIN}/${REPO}/"
