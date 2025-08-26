# S3ARCH - AI-Powered Writing Assistant

S3ARCH is an intelligent writing assistant that provides real-time text predictions and completions using Google's Gemini AI.

## Features

- **Real-time AI predictions**: Get intelligent text completions as you type
- **Memory bank**: Store and retrieve context for consistent writing
- **Cost tracking**: Monitor API usage and costs
- **Context modes**: Switch between memory-based and model-based predictions
- **Socratic memory**: AI-powered memory management

## Quick Start

### Prerequisites
- Node.js >= 18.0.0
- Gemini API key

### Setup
1. Install dependencies:
   ```bash
   npm install
   ```

2. Create a `.env.local` file with your Gemini API key:
   ```
   API_KEY=your_gemini_api_key_here
   ```

3. Start development server:
   ```bash
   npm run dev
   ```

4. Open your browser to the local development URL

## Development

```bash
# Start development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

- **Frontend**: React with TypeScript
- **AI Integration**: Google Gemini AI via @google/genai
- **Build Tool**: Vite
- **Styling**: CSS

## Configuration

Key configuration options in `index.tsx`:
- `BASE_SYSTEM_INSTRUCTION`: AI behavior configuration
- `PRICE_PER_INPUT_TOKEN`: Cost tracking for input tokens
- `PRICE_PER_OUTPUT_TOKEN`: Cost tracking for output tokens

## Memory System

S3ARCH features a sophisticated memory system:
- **Memory Bank**: Store persistent context
- **Context Modes**: Choose between memory-based and model-based predictions
- **Socratic Memory**: AI-assisted memory management

## Cost Management

Built-in cost tracking for API usage:
- Real-time token counting
- Cost estimation
- Usage statistics

## Contributing

This app is part of the S3ARCH monorepo. See the root README for contribution guidelines.

