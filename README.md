# S3ARCH Monorepo

A monorepo containing the S3ARCH Predictive Intelligence Test ecosystem and related applications.

## 🏗️ Project Structure

```
S3ARCH/
├── apps/
│   ├── s3arch/           # AI-powered writing assistant
│   └── tim3/             # TIM3 application (coming soon)
├── packages/
│   ├── shared/            # Common utilities and types
│   ├── core/              # Core business logic
│   └── ui/                # Reusable UI components
├── tools/                  # Build and deployment tools
└── docs/                   # Documentation
```

## 🚀 Getting Started

### Prerequisites
- Node.js >= 18.0.0
- npm >= 8.0.0

### Installation
```bash
# Install root dependencies
npm install

# Install all workspace dependencies
npm run install:all
```

### Development

#### S3ARCH App
```bash
npm run dev:s3arch
```

#### TIM3 App
```bash
npm run dev:tim3
```

### Building
```bash
# Build specific app
npm run build:s3arch
npm run build:tim3

# Build all apps
npm run build:all
```

## 📦 Workspaces

This monorepo uses npm workspaces to manage multiple packages:

- **apps/s3arch**: Your existing AI writing assistant
- **apps/tim3**: New TIM3 application (in development)
- **packages/shared**: Shared utilities and types
- **packages/core**: Core business logic
- **packages/ui**: Reusable UI components

## 🔧 Adding New Packages

To add a new package or app:

1. Create a new directory in `apps/` or `packages/`
2. Add a `package.json` with a unique name
3. Run `npm install` from the root to update workspaces

## 📚 Documentation

- [S3ARCH Documentation](./apps/s3arch/README.md)
- [TIM3 Documentation](./apps/tim3/README.md) (coming soon)
- [Shared Packages Documentation](./packages/shared/README.md) (coming soon)

## 🤝 Contributing

1. Create a feature branch
2. Make your changes
3. Test across affected workspaces
4. Submit a pull request

## 📄 License

[Add your license information here]