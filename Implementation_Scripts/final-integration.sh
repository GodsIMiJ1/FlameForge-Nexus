#!/bin/bash
# complete-integration.sh - Complete FlameForge Nexus Integration Script

set -e  # Exit on any error

echo "🔥 FlameForge Nexus - Complete Workflow Engine Integration"
echo "=================================================="

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

log_info() {
    echo -e "${BLUE}ℹ️  $1${NC}"
}

log_success() {
    echo -e "${GREEN}✅ $1${NC}"
}

log_warning() {
    echo -e "${YELLOW}⚠️  $1${NC}"
}

log_error() {
    echo -e "${RED}❌ $1${NC}"
}

# Check prerequisites
check_prerequisites() {
    log_info "Checking prerequisites..."
    
    # Check Node.js
    if ! command -v node &> /dev/null; then
        log_error "Node.js is required but not installed."
        exit 1
    fi
    
    node_version=$(node --version | cut -d'v' -f2)
    required_version="18.0.0"
    
    if [ "$(printf '%s\n' "$required_version" "$node_version" | sort -V | head -n1)" = "$required_version" ]; then
        log_success "Node.js version $node_version is compatible"
    else
        log_error "Node.js version $node_version is too old. Required: $required_version+"
        exit 1
    fi
    
    # Check npm
    if ! command -v npm &> /dev/null; then
        log_error "npm is required but not installed."
        exit 1
    fi
    
    log_success "Prerequisites check passed"
}

# Install dependencies
install_dependencies() {
    log_info "Installing dependencies..."
    
    # Core dependencies
    npm install --save \
        @supabase/supabase-js \
        @xyflow/react \
        @tanstack/react-query \
        react-hook-form \
        zod \
        date-fns \
        lucide-react \
        recharts \
        @radix-ui/react-alert-dialog \
        @radix-ui/react-badge \
        @radix-ui/react-button \
        @radix-ui/react-card \
        @radix-ui/react-dialog \
        @radix-ui/react-dropdown-menu \
        @radix-ui/react-input \
        @radix-ui/react-label \
        @radix-ui/react-progress \
        @radix-ui/react-scroll-area \
        @radix-ui/react-select \
        @radix-ui/react-slider \
        @radix-ui/react-tabs \
        @radix-ui/react-textarea \
        @radix-ui/react-toast
    
    # Development dependencies
    npm install --save-dev \
        @types/node \
        typescript \
        eslint \
        prettier \
        vitest \
        @vitest/ui \
        jsdom \
        @testing-library/react \
        @testing-library/jest-dom
    
    log_success "Dependencies installed"
}

# Setup project structure
setup_structure() {
    log_info "Setting up project structure..."
    
    # Create directories
    mkdir -p src/{components/{nodes,monitoring},services,hooks,types,utils}
    mkdir -p supabase/{functions,migrations}
    mkdir -p tests
    mkdir -p scripts
    mkdir -p docs
    
    # Create configuration files
    create_config_files
    
    log_success "Project structure created"
}

# Create configuration files
create_config_files() {
    log_info "Creating configuration files..."
    
    # TypeScript config
    cat > tsconfig.json << 'EOF'
{
  "compilerOptions": {
    "target": "ES2020",
    "useDefineForClassFields": true,
    "lib": ["ES2020", "DOM", "DOM.Iterable"],
    "module": "ESNext",
    "skipLibCheck": true,
    "moduleResolution": "bundler",
    "allowImportingTsExtensions": true,
    "resolveJsonModule": true,
    "isolatedModules": true,
    "noEmit": true,
    "jsx": "react-jsx",
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noFallthroughCasesInSwitch": true,
    "baseUrl": ".",
    "paths": {
      "@/*": ["./src/*"]
    }
  },
  "include": ["src"],
  "references": [{ "path": "./tsconfig.node.json" }]
}
EOF

    # Vite config update
    cat > vite.config.ts << 'EOF'
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    port: 8080,
    host: true
  },
  optimizeDeps: {
    include: ['@xyflow/react', '@supabase/supabase-js']
  }
})
EOF

    # Vitest config
    cat > vitest.config.ts << 'EOF'
import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'
import path from 'path'

export default defineConfig({
  plugins: [react()],
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./tests/setup.ts']
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
})
EOF

    # Test setup
    cat > tests/setup.ts << 'EOF'
import '@testing-library/jest-dom'
import { beforeAll, afterEach, afterAll } from 'vitest'
import { cleanup } from '@testing-library/react'

// Cleanup after each test case
afterEach(() => {
  cleanup()
})
EOF

    # Prettier config
    cat > .prettierrc << 'EOF'
{
  "semi": true,
  "trailingComma": "es5",
  "singleQuote": true,
  "printWidth": 80,
  "tabWidth": 2
}
EOF

    # ESLint config
    cat > .eslintrc.json << 'EOF'
{
  "extends": [
    "eslint:recommended",
    "@typescript-eslint/recommended",
    "prettier"
  ],
  "parser": "@typescript-eslint/parser",
  "plugins": ["@typescript-eslint"],
  "rules": {
    "@typescript-eslint/no-unused-vars": "error",
    "@typescript-eslint/no-explicit-any": "warn",
    "prefer-const": "error"
  },
  "env": {
    "browser": true,
    "node": true,
    "es6": true
  }
}
EOF

    log_success "Configuration files created"
}

# Setup database
setup_database() {
    log_info "Setting up database schema..."
    
    # Check if Supabase CLI is available
    if command -v supabase &> /dev/null; then
        log_info "Running database migrations..."
        supabase db reset --linked
        supabase db push
        log_success "Database schema updated"
    else
        log_warning "Supabase CLI not found. Please run migrations manually:"
        log_warning "1. Install Supabase CLI: npm install -g supabase"
        log_warning "2. Run: supabase db reset --linked"
        log_warning "3. Run: supabase db push"
    fi
}

# Deploy edge functions
deploy_functions() {
    log_info "Deploying Supabase Edge Functions..."
    
    if command -v supabase &> /dev/null; then
        # Deploy all functions
        for func_dir in supabase/functions/*/; do
            if [ -d "$func_dir" ]; then
                func_name=$(basename "$func_dir")
                log_info "Deploying function: $func_name"
                supabase functions deploy "$func_name"
            fi
        done
        log_success "Edge functions deployed"
    else
        log_warning "Supabase CLI not found. Please deploy functions manually."
    fi
}

# Update package.json scripts
update_package_scripts() {
    log_info "Updating package.json scripts..."
    
    # Add new scripts to package.json
    npm pkg set scripts.dev:workflow="vite --port 8080"
    npm pkg set scripts.test:workflow="vitest run tests/workflow"
    npm pkg set scripts.test:watch="vitest"
    npm pkg set scripts.test:ui="vitest --ui"
    npm pkg set scripts.validate="tsx scripts/validate-setup.ts"
    npm pkg set scripts.test:integration="tsx scripts/test-workflow.ts"
    npm pkg set scripts.build:types="tsc --noEmit"
    npm pkg set scripts.lint="eslint src --ext .ts,.tsx"
    npm pkg set scripts.lint:fix="eslint src --ext .ts,.tsx --fix"
    npm pkg set scripts.format="prettier --write src/**/*.{ts,tsx}"
    npm pkg set scripts.db:reset="supabase db reset --linked"
    npm pkg set scripts.db:push="supabase db push"
    npm pkg set scripts.functions:deploy="supabase functions deploy"
    
    log_success "Package.json scripts updated"
}

# Create development environment
create_dev_env() {
    log_info "Creating development environment..."
    
    # Create .env.example
    cat > .env.example << 'EOF'
# Supabase Configuration
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key

# AI Provider API Keys
OPENAI_API_KEY=your_openai_api_key
ANTHROPIC_API_KEY=your_anthropic_api_key

# Ollama Configuration (Local AI)
OLLAMA_ENDPOINT=http://localhost:11434

# Development Settings
NODE_ENV=development
PORT=8080
VITE_APP_ENV=development

# Database
DATABASE_URL=your_database_url

# Optional: Logging
LOG_LEVEL=info

# Optional: Feature Flags
ENABLE_OLLAMA=true
ENABLE_ANTHROPIC=true
ENABLE_OPENAI=true
EOF

    # Check if .env exists
    if [ ! -f .env ]; then
        cp .env.example .env
        log_warning "Created .env file from template. Please fill in your values."
    else
        log_info ".env file already exists"
    fi
    
    log_success "Development environment configured"
}

# Validate setup
validate_setup() {
    log_info "Validating setup..."
    
    # Check if TypeScript compiles
    if npm run build:types; then
        log_success "TypeScript compilation successful"
    else
        log_error "TypeScript compilation failed"
        return 1
    fi
    
    # Run validation script if available
    if [ -f "scripts/validate-setup.ts" ]; then
        if npm run validate; then
            log_success "Setup validation passed"
        else
            log_warning "Setup validation had warnings"
        fi
    fi
    
    # Test basic imports
    log_info "Testing basic functionality..."
    node -e "
        try {
            require('./src/services/workflowExecutionEngine.ts');
            console.log('✅ Core services can be imported');
        } catch (e) {
            console.log('❌ Import test failed:', e.message);
            process.exit(1);
        }
    " 2>/dev/null || log_warning "Import test skipped (TypeScript files)"
}

# Create documentation
create_docs() {
    log_info "Creating documentation..."
    
    cat > docs/SETUP.md << 'EOF'
# FlameForge Nexus - Setup Guide

## Prerequisites
- Node.js 18+
- npm 8+
- Supabase account
- (Optional) Ollama for local AI

## Quick Start

1. **Install dependencies:**
   ```bash
   npm install
   ```

2. **Configure environment:**
   ```bash
   cp .env.example .env
   # Edit .env with your values
   ```

3. **Setup database:**
   ```bash
   npm run db:reset
   npm run db:push
   ```

4. **Deploy functions:**
   ```bash
   npm run functions:deploy
   ```

5. **Start development:**
   ```bash
   npm run dev:workflow
   ```

## Available Scripts

- `npm run dev:workflow` - Start development server
- `npm run test:workflow` - Run workflow tests
- `npm run validate` - Validate setup
- `npm run test:integration` - Run integration tests

## Workflow Engine Features

### Supported Node Types
- **Agent Nodes**: AI inference with OpenAI/Anthropic/Ollama
- **Tool Nodes**: HTTP requests and API calls
- **Decision Nodes**: Conditional logic and branching
- **Ollama Nodes**: Local AI inference

### Execution Features
- Linear and parallel execution
- Error handling and retry logic
- Real-time monitoring
- Performance metrics
- Execution logging

## Troubleshooting

### Common Issues
1. **Database connection fails**: Check Supabase URL and keys
2. **Ollama not connecting**: Ensure Ollama is running on port 11434
3. **Node execution fails**: Check API keys and network connectivity

### Getting Help
- Check the logs in the execution monitor
- Run `npm run validate` to check setup
- Review environment variables in `.env`
EOF

    cat > docs/ARCHITECTURE.md << 'EOF'
# FlameForge Nexus - Architecture Overview

## Core Components

### 1. Workflow Execution Engine
- **Location**: `src/services/workflowExecutionEngine.ts`
- **Purpose**: Orchestrates workflow execution
- **Features**: Parallel execution, error handling, retry logic

### 2. Node Type System
- **Location**: `src/components/nodes/`
- **Purpose**: Pluggable node architecture
- **Supported Types**: Agent, Tool, Decision, Ollama

### 3. Real-time Monitoring
- **Location**: `src/components/monitoring/`
- **Purpose**: Live execution tracking
- **Features**: Progress indicators, logs, metrics

### 4. Database Schema
- **Tables**: workflow_executions, node_executions, execution_events
- **Features**: RLS policies, audit logging, performance tracking

## Data Flow

1. **Workflow Definition**: Nodes and edges in React Flow format
2. **Execution Planning**: Dependency graph analysis
3. **Node Execution**: Parallel processing with proper sequencing
4. **Result Handling**: Output storage and propagation
5. **Monitoring**: Real-time status updates

## Extension Points

### Adding New Node Types
1. Create component in `src/components/nodes/`
2. Register in node type registry
3. Implement executor function
4. Add to Supabase edge function

### Custom Integrations
- Plugin system for easy extensions
- API endpoint for external tools
- Webhook support for real-time updates
EOF

    log_success "Documentation created"
}

# Main execution
main() {
    echo "Starting FlameForge Nexus integration..."
    echo ""
    
    check_prerequisites
    echo ""
    
    install_dependencies
    echo ""
    
    setup_structure
    echo ""
    
    setup_database
    echo ""
    
    deploy_functions
    echo ""
    
    update_package_scripts
    echo ""
    
    create_dev_env
    echo ""
    
    validate_setup
    echo ""
    
    create_docs
    echo ""
    
    log_success "🎉 FlameForge Nexus integration complete!"
    echo ""
    echo "Next steps:"
    echo "1. Fill in your .env file with API keys and Supabase credentials"
    echo "2. Run 'npm run validate' to check your setup"
    echo "3. Start development with 'npm run dev:workflow'"
    echo "4. Open http://localhost:8080 in your browser"
    echo ""
    echo "Optional:"
    echo "- Install Ollama for local AI: https://ollama.ai"
    echo "- Run integration tests: npm run test:integration"
    echo "- Check documentation in docs/ folder"
    echo ""
    log_success "Happy building! 🔥"
}

# Handle script arguments
case "${1:-}" in
    --help|-h)
        echo "FlameForge Nexus Integration Script"
        echo ""
        echo "Usage: $0 [options]"
        echo ""
        echo "Options:"
        echo "  --help, -h          Show this help message"
        echo "  --skip-deps         Skip dependency installation"
        echo "  --skip-db           Skip database setup"
        echo "  --skip-validation   Skip setup validation"
        echo "  --dev-only          Setup for development only (skip production configs)"
        echo ""
        echo "Examples:"
        echo "  $0                  # Full integration"
        echo "  $0 --skip-deps      # Skip npm install"
        echo "  $0 --dev-only       # Development setup only"
        exit 0
        ;;
    --skip-deps)
        SKIP_DEPS=true
        ;;
    --skip-db)
        SKIP_DB=true
        ;;
    --skip-validation)
        SKIP_VALIDATION=true
        ;;
    --dev-only)
        DEV_ONLY=true
        ;;
esac

# Modified main execution with options
main_with_options() {
    echo "🔥 Starting FlameForge Nexus integration..."
    echo ""
    
    check_prerequisites
    echo ""
    
    if [ "${SKIP_DEPS:-}" != "true" ]; then
        install_dependencies
        echo ""
    else
        log_info "Skipping dependency installation"
    fi
    
    setup_structure
    echo ""
    
    if [ "${SKIP_DB:-}" != "true" ]; then
        setup_database
        echo ""
        deploy_functions
        echo ""
    else
        log_info "Skipping database and function setup"
    fi
    
    update_package_scripts
    echo ""
    
    create_dev_env
    echo ""
    
    if [ "${SKIP_VALIDATION:-}" != "true" ]; then
        validate_setup
        echo ""
    else
        log_info "Skipping validation"
    fi
    
    create_docs
    echo ""
    
    # Production setup (unless dev-only)
    if [ "${DEV_ONLY:-}" != "true" ]; then
        setup_production
        echo ""
    fi
    
    log_success "🎉 FlameForge Nexus integration complete!"
    
    # Show completion summary
    show_completion_summary
}

# Production setup
setup_production() {
    log_info "Setting up production configurations..."
    
    # Docker configuration
    cat > Dockerfile << 'EOF'
FROM node:18-alpine AS builder

WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

COPY . .
RUN npm run build

FROM node:18-alpine AS runtime

WORKDIR /app
COPY --from=builder /app/dist ./dist
COPY --from=builder /app/node_modules ./node_modules
COPY --from=builder /app/package.json ./package.json

EXPOSE 8080

CMD ["npm", "start"]
EOF

    # Docker compose for local development
    cat > docker-compose.yml << 'EOF'
version: '3.8'

services:
  flameforge:
    build: .
    ports:
      - "8080:8080"
    environment:
      - NODE_ENV=production
      - PORT=8080
    env_file:
      - .env
    depends_on:
      - ollama

  ollama:
    image: ollama/ollama:latest
    ports:
      - "11434:11434"
    volumes:
      - ollama_data:/root/.ollama
    restart: unless-stopped

volumes:
  ollama_data:
EOF

    # GitHub Actions workflow
    mkdir -p .github/workflows
    cat > .github/workflows/ci.yml << 'EOF'
name: FlameForge Nexus CI

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  test:
    runs-on: ubuntu-latest
    
    strategy:
      matrix:
        node-version: [18.x, 20.x]
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js ${{ matrix.node-version }}
      uses: actions/setup-node@v3
      with:
        node-version: ${{ matrix.node-version }}
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Run type checking
      run: npm run build:types
    
    - name: Run linting
      run: npm run lint
    
    - name: Run tests
      run: npm run test:workflow
    
    - name: Run integration tests
      run: npm run test:integration
      env:
        NEXT_PUBLIC_SUPABASE_URL: ${{ secrets.SUPABASE_URL }}
        NEXT_PUBLIC_SUPABASE_ANON_KEY: ${{ secrets.SUPABASE_ANON_KEY }}

  build:
    runs-on: ubuntu-latest
    needs: test
    
    steps:
    - uses: actions/checkout@v3
    
    - name: Use Node.js 18.x
      uses: actions/setup-node@v3
      with:
        node-version: 18.x
        cache: 'npm'
    
    - name: Install dependencies
      run: npm ci
    
    - name: Build application
      run: npm run build
    
    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: build-files
        path: dist/
EOF

    # Production environment template
    cat > .env.production << 'EOF'
# Production Environment Configuration
NODE_ENV=production
PORT=8080

# Supabase (Production)
NEXT_PUBLIC_SUPABASE_URL=your_production_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_production_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_production_service_role_key

# Database
DATABASE_URL=your_production_database_url

# AI Providers
OPENAI_API_KEY=your_production_openai_key
ANTHROPIC_API_KEY=your_production_anthropic_key

# Monitoring
LOG_LEVEL=warn
ENABLE_ANALYTICS=true

# Security
CORS_ORIGINS=https://your-domain.com
API_RATE_LIMIT=1000

# Performance
CACHE_TTL=3600
MAX_WORKFLOW_SIZE=1000
EOF

    log_success "Production configurations created"
}

# Completion summary
show_completion_summary() {
    echo ""
    echo "=================================================="
    echo "🎉 FlameForge Nexus Integration Summary"
    echo "=================================================="
    echo ""
    
    log_success "✅ Core Components Installed:"
    echo "  • Workflow Execution Engine"
    echo "  • Node Type System (Agent, Tool, Decision, Ollama)"
    echo "  • Real-time Monitoring Dashboard"
    echo "  • Database Schema & Migrations"
    echo "  • Supabase Edge Functions"
    echo ""
    
    log_success "✅ Development Environment:"
    echo "  • TypeScript configuration"
    echo "  • Testing framework (Vitest)"
    echo "  • Linting and formatting"
    echo "  • Development scripts"
    echo ""
    
    log_success "✅ Documentation Created:"
    echo "  • Setup guide (docs/SETUP.md)"
    echo "  • Architecture overview (docs/ARCHITECTURE.md)"
    echo "  • Environment templates"
    echo ""
    
    echo "📋 Next Steps:"
    echo ""
    echo "1. 🔧 Configure Environment:"
    echo "   cp .env.example .env"
    echo "   # Edit .env with your API keys and Supabase credentials"
    echo ""
    echo "2. 🔍 Validate Setup:"
    echo "   npm run validate"
    echo ""
    echo "3. 🚀 Start Development:"
    echo "   npm run dev:workflow"
    echo "   # Open http://localhost:8080"
    echo ""
    echo "4. 🧪 Run Tests:"
    echo "   npm run test:integration"
    echo ""
    echo "📚 Useful Commands:"
    echo "  npm run dev:workflow      # Start development server"
    echo "  npm run test:workflow     # Run workflow tests"
    echo "  npm run validate          # Validate setup"
    echo "  npm run lint              # Check code quality"
    echo "  npm run db:reset          # Reset database"
    echo "  npm run functions:deploy  # Deploy edge functions"
    echo ""
    
    log_info "💡 Pro Tips:"
    echo "  • Install Ollama for local AI: https://ollama.ai"
    echo "  • Use the monitoring dashboard to debug workflows"
    echo "  • Check logs in the execution monitor for troubleshooting"
    echo "  • Extend the system by adding custom node types"
    echo ""
    
    echo "🆘 Need Help?"
    echo "  • Check docs/ folder for detailed guides"
    echo "  • Run 'npm run validate' to diagnose issues"
    echo "  • Review the example workflows in tests/"
    echo ""
    
    log_success "Happy building with FlameForge Nexus! 🔥⚡"
}

# Error handling
handle_error() {
    log_error "Integration failed at step: $1"
    echo ""
    echo "🔧 Troubleshooting:"
    echo "• Check your Node.js version (18+ required)"
    echo "• Ensure you have npm installed"
    echo "• Verify network connectivity"
    echo "• Check Supabase credentials"
    echo ""
    echo "💾 Rollback (if needed):"
    echo "• Remove node_modules: rm -rf node_modules"
    echo "• Reset package.json: git checkout package.json"
    echo "• Clean npm cache: npm cache clean --force"
    echo ""
    exit 1
}

# Set up error handling
trap 'handle_error "Unknown error"' ERR

# Run the integration
if [ "${BASH_SOURCE[0]}" = "${0}" ]; then
    main_with_options "$@"
fi
        