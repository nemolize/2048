# 2048 Game

An implementation of the classic 2048 puzzle game built with React, TypeScript, and Vite.

## Features

- **Classic 2048 gameplay**
- **Touch/swipe controls** for mobile devices using interact.js
- **Keyboard controls** for desktop (arrow keys)
- **Responsive design** that works on all screen sizes
- **Game state management** with score tracking and win/lose detection
- **Tech stack**: React, TypeScript, Vite, Tailwind CSS
- **Comprehensive testing** with Vitest and Playwright
- **Code quality tools**: Biome for linting and formatting
- **Automated dependency updates** with Renovate

## Getting Started

### Prerequisites

- Node.js (see `mise.toml` for version requirements)
- pnpm package manager

### Installation

```bash
pnpm install
```

### Development

Start the development server:

```bash
pnpm dev
```

The game will be available at `http://localhost:5173`

#### How to Play

- **Desktop**: Use arrow keys to move tiles
- **Mobile**: Swipe in any direction to move tiles
- **Goal**: Combine tiles with the same number to reach 2048
- **Controls**: 
  - Arrow keys or swipe gestures to move tiles
  - "New Game" button to restart
  - "Reset Game" button to start over anytime

### Building

Build for production:

```bash
pnpm build
```

Preview the production build:

```bash
pnpm preview
```

### Testing

Run unit tests:

```bash
pnpm test
```

Run end-to-end tests:

```bash
pnpm test:e2e
```

### Code Quality

Check code style and issues:

```bash
pnpm lint
```

Fix code style issues:

```bash
pnpm lint:fix
```

Run type checking:

```bash
pnpm typecheck
```

## License

MIT
