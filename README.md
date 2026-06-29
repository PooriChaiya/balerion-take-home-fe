# Salmon Allocation Tool

Interactive web UI for allocating limited salmon stock to 5,000+ customer orders.

---

## Setup

### Prerequisites

- **Node.js 20+** (check with `node --version`)
- A package manager (npm, yarn, pnpm, or bun)

### Installing Node.js

| Platform | How to Install |
|----------|----------------|
| **macOS** | `brew install node` ([Homebrew](https://brew.sh)) OR download from [nodejs.org](https://nodejs.org) |
| **Windows** | Download installer from [nodejs.org](https://nodejs.org) OR `winget install OpenJS.NodeJS.LTS` |
| **Linux** | `sudo apt install nodejs` (Debian/Ubuntu) OR `sudo dnf install nodejs` (Fedora) |

Verify install: `node --version` (should show v20+)

### Install Package Manager (if needed)

**npm** — included with Node.js. No extra install needed.

**yarn** (optional):
```bash
corepack enable          # Enable yarn (built into Node 16+)
yarn --version
```

**pnpm** (optional):
```bash
npm install -g pnpm      # or: corepack enable && corepack prepare pnpm@latest --activate
pnpm --version
```

**bun** (optional):
```bash
# macOS/Linux
curl -fsSL https://bun.sh/install | bash

# Windows (PowerShell)
powershell -c "irm bun.sh/install.ps1|iex"
```

### Clone & Install

```bash
# Clone the repo
git clone <repo-url>
cd balerion-take-home-fe

# Install dependencies (pick one)
npm install       # npm
yarn install      # yarn
pnpm install      # pnpm
bun install       # bun
```

### Run Development Server

```bash
npm run dev        # npm
yarn dev           # yarn
pnpm dev           # pnpm
bun run dev        # bun
```

Open http://localhost:3000

**Port already in use?**
```bash
# Use a different port
npm run dev -- -p 3001       # npm
yarn dev -p 3001              # yarn
PORT=3001 pnpm dev            # pnpm (Linux/macOS)
set PORT=3001 && pnpm dev    # pnpm (Windows PowerShell)
```

### Other Commands

```bash
npm run build          # Production build
npm run start          # Run production build
```

## Troubleshooting

| Issue | Solution |
|-------|----------|
| `node: command not found` | Install Node.js (see [Setup](#setup)) |
| `EACCES` permission errors | Don't use `sudo`. Fix npm permissions: `mkdir -p ~/.npm-global && npm config set prefix ~/.npm-global` |
| Port 3000 already in use | Use different port: `npm run dev -- -p 3001` |
| Module not found errors | Delete `node_modules` + `.next`, rerun `npm install` |
| TypeScript errors in IDE | Ensure `@types/node` is installed (included in devDependencies) |

## Project Structure

```
balerion-take-home-fe/
├── app/                      # Next.js App Router
│   ├── allocation/           # Allocation page
│   ├── layout.tsx
│   └── providers.tsx         # Redux Provider
├── components/allocation/    # React components
├── store/                    # Redux slices
├── hooks/                    # Custom hooks
├── lib/allocation/           # Pure algorithm functions
├── public/mock-data/         # JSON files
└── tests/allocation/         # Vitest tests
```
