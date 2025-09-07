# FlameForge Nexus - AI Workflow Automation Platform

<div align="center">
  <h3>🔥 Advanced AI Workflow Automation Platform 🔥</h3>
  <p><strong>Developed by GodsIMiJ AI Solutions</strong></p>
  <p>Design, deploy, and monitor intelligent agent workflows with visual precision</p>
</div>

---

## 🚀 Overview

FlameForge Nexus is a cutting-edge AI workflow automation platform that empowers developers and organizations to create sophisticated multi-agent systems through an intuitive visual interface. Built with modern web technologies and powered by advanced AI capabilities, it bridges the gap between complex AI orchestration and user-friendly design.

## ✨ Key Features

### ✅ Phase 1 Complete - Working Features
- **🎨 Visual Workflow Designer**: Drag-and-drop interface for creating complex AI agent workflows
- **🔥 Model Management Dashboard**: Local AI model oversight ✅ **FIXED & WORKING**
- **🤖 Ollama Integration**: Execute AI models locally with full integration
- **🎯 Real-time Monitoring**: Performance and system metrics tracking
- **🌙 Dark Theme**: Modern, consistent UI throughout the application
- **⚙️ Advanced Configuration**: Granular AI parameter control

### 🚧 Phase 2 In Progress
- **🤖 Multi-Agent Orchestration**: Coordinate multiple AI agents with different specializations
- **🔗 Extensive Integrations**: Connect with GitHub, Slack, databases, and external APIs
- **💬 AI-Powered Chat Assistant**: Context-aware AI assistant that understands your workflows
- **🔐 Enterprise Security**: Row-level security, API key management, and fine-grained permissions
- **📊 Advanced Analytics**: Track workflow execution with detailed analytics
- **🌐 RESTful API**: Full programmatic access for external integrations
- **⚡ Vector Memory**: AI-powered memory system for intelligent context retention
- **📈 Performance Optimization**: Intelligent caching and load balancing

## 🛠 Technology Stack

**Frontend:**
- React 18 with TypeScript
- Vite for lightning-fast development
- Tailwind CSS + shadcn/ui for modern design
- React Flow for visual workflow canvas
- TanStack Query for state management

**Backend:**
- Supabase (PostgreSQL + Edge Functions)
- Vector embeddings with pgvector
- Row Level Security (RLS)
- Real-time subscriptions

## 🏃‍♂️ Quick Start

### Prerequisites
- Node.js 18+ and npm
- Git

### Installation

```bash
# 1. Clone the repository
git clone <YOUR_REPOSITORY_URL>
cd flameforge-nexus

# 2. Install dependencies
npm install

# 3. Set up environment variables
cp .env.example .env.local
# Edit .env.local with your Supabase credentials

# 4. Start the development server
npm run dev
```

The application will be available at `http://localhost:8081`

### Key Pages
- **Main Workbench**: `/` - Visual workflow builder
- **Model Management**: `/model-management` ✅ **WORKING**
- **API Settings**: `/api-settings` - Configuration panel

## 🔥 Ollama Integration

FlameForge Nexus includes powerful local AI integration through Ollama:

### Quick Setup
1. **Install Ollama**: Download from [ollama.ai](https://ollama.ai)
2. **Start Ollama**: Run `ollama serve` in your terminal
3. **Pull a Model**: `ollama pull llama2`
4. **Configure in FlameForge**: Go to API Settings → Ollama Integration

### Features
- **Auto-Discovery**: Automatically finds local Ollama instances
- **Multi-Instance Support**: Connect to multiple Ollama servers
- **Real-time Monitoring**: Live connection status and health checks
- **Visual Workflow Integration**: Drag-and-drop Ollama nodes
- **Performance Tracking**: Detailed execution metrics and logs

### Supported Models
- **General**: llama2, mistral, neural-chat
- **Code**: codellama, deepseek-coder, starcoder
- **Specialized**: vicuna, orca-mini, dolphin

For detailed setup instructions, see [docs/OLLAMA_INTEGRATION.md](./docs/OLLAMA_INTEGRATION.md)

## 🔧 Development

### Available Scripts

```bash
npm run dev          # Start development server
npm run build        # Build for production
npm run preview      # Preview production build
npm run lint         # Run ESLint
npm run test         # Run tests
npm run test:ui      # Run tests with UI
npm run test:coverage # Run tests with coverage
```

### Project Structure

```
src/
├── components/          # React components
│   ├── workbench/      # Workflow builder components
│   ├── chat/           # AI chat interface
│   ├── api/            # API management
│   └── ui/             # Reusable UI components
├── pages/              # Route components
├── hooks/              # Custom React hooks
├── types/              # TypeScript definitions
└── integrations/       # External service integrations

public/
├── FlameOS_favicon.png  # Custom favicon
├── eye-of-kai_logo.png  # GodsIMiJ AI Solutions logo
├── NODE_watermark.png   # Subtle watermark for canvas
└── robots.txt          # SEO configuration

supabase/
├── functions/          # Edge Functions
│   ├── flameforge-api/ # Main API endpoints
│   ├── execute-ollama-node/ # Ollama execution
│   └── ai-chat/        # AI chat functionality
└── migrations/         # Database schema

docs/
├── OLLAMA_INTEGRATION.md # Ollama setup and usage guide
└── API_REFERENCE.md     # Complete API documentation

tests/
└── ollama.test.ts      # Ollama integration tests
```

## 🚀 Deployment

### Recommended Platforms

- **Vercel**: Automatic deployments from Git
- **Netlify**: Git-based continuous deployment
- **Custom VPS**: Build and deploy manually

### Build Process

```bash
npm run build
# Deploy the `dist` folder to your hosting platform
```

## 🔑 API Documentation

FlameForge Nexus provides a comprehensive REST API for external integrations:

**Base URL**: `https://your-supabase-project.supabase.co/functions/v1/flameforge-api`

**Authentication**: Include `X-API-Key` header with your API key

**Key Endpoints**:
- `GET /workflows` - List workflows
- `POST /workflows` - Create workflow
- `POST /workflows/{id}/execute` - Execute workflow
- `GET /chat/messages` - Chat history
- `POST /chat/send` - Send AI message

## 🤝 Contributing

We welcome contributions from the community! Please read our contributing guidelines and submit pull requests for any improvements.

## 📄 License

This project is proprietary software developed by **GodsIMiJ AI Solutions**. All rights reserved.

## 🆘 Support

For support, feature requests, or questions:
- 📧 Email: james@godsimij-ai-solutions.com
- 🌐 Website: [GodsIMiJ AI Solutions](https://godsimij-ai-solutions.com)

---

<div align="center">
  <p><strong>Built with ❤️ by GodsIMiJ AI Solutions</strong></p>
  <p>Empowering the future of AI workflow automation</p>
</div>
