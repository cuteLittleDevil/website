# Personal site — local build & preview
# Usage: make          # build + serve at http://localhost:4173
#        make help

PORT ?= 4173
NODE_BIN := $(shell command -v node 2>/dev/null)
NPM_BIN  := $(shell command -v npm 2>/dev/null)

.PHONY: help install build preview serve clean open

help:
	@echo "Targets:"
	@echo "  make / make preview  Build dist/ and serve at http://localhost:$(PORT)"
	@echo "  make install         npm install"
	@echo "  make build           npm run build → dist/"
	@echo "  make serve           Serve existing dist/ (no rebuild)"
	@echo "  make clean           Remove dist/"
	@echo "  make open            Open preview URL in browser (macOS)"
	@echo ""
	@echo "PORT=$(PORT)  (override: make preview PORT=3000)"

install:
	@test -n "$(NPM_BIN)" || (echo "npm not found; install Node.js >= 20" && exit 1)
	npm install

build:
	@test -n "$(NPM_BIN)" || (echo "npm not found; install Node.js >= 20" && exit 1)
	@if [ ! -d node_modules ]; then npm install; fi
	npm run build

# Default: rebuild then serve (what you want for local check)
preview: build
	@echo ""
	@echo "→ http://localhost:$(PORT)"
	@echo "  Ctrl+C to stop"
	@echo ""
	npx --yes serve dist -p $(PORT)

serve:
	@test -d dist || (echo "dist/ missing; run: make build" && exit 1)
	@echo "→ http://localhost:$(PORT)"
	npx --yes serve dist -p $(PORT)

clean:
	rm -rf dist

open:
	@open "http://localhost:$(PORT)" 2>/dev/null || true

# bare `make` == preview
.DEFAULT_GOAL := preview
