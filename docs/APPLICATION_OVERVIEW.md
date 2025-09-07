# FlameForge Nexus - Application Overview

## 🎯 **What We Have Now**
A fully functional **AI Workflow Visual Builder** - a sophisticated drag-and-drop interface for creating AI agent workflows, similar to tools like Zapier or n8n but specifically designed for AI agents and tools.

---

## 🏗️ **Core Architecture**

### **Frontend Stack**
- **React 18** with TypeScript
- **Vite** for fast development and building
- **React Flow** for the visual node-based workflow canvas
- **Tailwind CSS** for styling with custom design system
- **Radix UI** components for accessible UI primitives
- **Lucide React** for consistent iconography

### **Backend Integration**
- **Supabase** integration ready (database, auth, real-time)
- **API Settings** page for configuring multiple AI providers
- **Modular service architecture** for extensibility

---

## 🎨 **User Interface Components**

### **1. Main Workbench Layout**
```
┌─────────────────────────────────────────────────────────┐
│                    Toolbar                              │
├─────────────┬───────────────────────────────────────────┤
│             │                                           │
│   Sidebar   │            Canvas Area                    │
│             │                                           │
│   - Nodes   │   [Drag & Drop Workflow Builder]          │
│   - Tools   │                                           │
│   - Agents  │                                           │
│             │                                           │
└─────────────┴───────────────────────────────────────────┘
```

### **2. Workbench Toolbar**
- **Import/Export** workflow functionality
- **Save/Load** workflows
- **Zoom controls** for canvas navigation
- **Grid toggle** for precise node placement
- **Workflow validation** indicators

### **3. Node Palette Sidebar**
Organized categories of draggable components:

#### **🤖 AI Agents**
- **OpenAI Agent** - GPT-3.5/4 powered agents
- **Anthropic Agent** - Claude-powered agents
- **Ollama Agent** - Local LLM integration
- **Advanced Ollama** - Enhanced local AI with real-time monitoring 🔥 **NEW**
- **Custom Agent** - Configurable AI agents

#### **🛠️ Tools & Actions**
- **HTTP Tool** - REST API calls
- **Database Tool** - Database operations
- **File Tool** - File system operations
- **Email Tool** - Email sending/receiving
- **Webhook Tool** - Webhook triggers

#### **🔀 Logic & Control**
- **Decision Node** - Conditional branching
- **Loop Node** - Iteration control
- **Delay Node** - Timing control
- **Merge Node** - Data combination

#### **📊 Data Processing**
- **Transform Node** - Data transformation
- **Filter Node** - Data filtering
- **Aggregate Node** - Data aggregation
- **Validation Node** - Data validation

### **4. Visual Node System**
Each node type has:
- **Custom styling** with color-coded categories
- **Input/Output handles** for connections
- **Configuration panels** for settings
- **Status indicators** (idle, running, complete, error)
- **Hover effects** and animations
- **Drag handles** for repositioning

---

## 🎛️ **Node Configuration System**

### **Agent Nodes**
```typescript
interface AgentNodeData {
  label: string;
  provider: 'openai' | 'anthropic' | 'ollama' | 'custom';
  model: string;
  systemPrompt: string;
  temperature: number;
  maxTokens: number;
  tools: string[];
}
```

### **Tool Nodes**
```typescript
interface ToolNodeData {
  label: string;
  toolType: 'http' | 'database' | 'file' | 'email' | 'webhook';
  method: string;
  url: string;
  headers: Record<string, string>;
  body: string;
  authentication: AuthConfig;
}
```

### **Decision Nodes**
```typescript
interface DecisionNodeData {
  label: string;
  condition: string;
  operator: 'equals' | 'contains' | 'greater' | 'less';
  value: string;
  trueOutput: string;
  falseOutput: string;
}
```

---

## ⚙️ **API Settings & Configuration**

### **Multi-Provider Support**
- **OpenAI** - API key configuration for GPT models
- **Anthropic** - Claude API integration
- **Ollama** - Local LLM server connection
- **Custom APIs** - Configurable endpoints

### **Settings Management**
- **Secure storage** of API keys
- **Provider validation** and testing
- **Rate limiting** configuration
- **Model selection** per provider

---

## 🤖 **AI Chat Assistant**

### **Workflow Context Awareness**
- **Current workflow** understanding
- **Node configuration** assistance
- **Best practices** recommendations
- **Troubleshooting** help

### **Interactive Features**
- **Natural language** workflow creation
- **Code generation** for custom nodes
- **Workflow optimization** suggestions
- **Real-time assistance** during building

---

## 🎨 **Design System**

### **Color Palette**
```css
/* Node Categories */
--node-agent: #8B5CF6     /* Purple for AI agents */
--node-tool: #10B981      /* Green for tools */
--node-logic: #F59E0B     /* Orange for logic */
--node-data: #3B82F6      /* Blue for data */

/* Status Colors */
--status-idle: #6B7280    /* Gray */
--status-running: #3B82F6 /* Blue */
--status-success: #10B981 /* Green */
--status-error: #EF4444   /* Red */
```

### **Typography**
- **Inter font** for clean readability
- **Consistent sizing** scale
- **Proper contrast** ratios
- **Responsive** text sizing

### **Animations**
- **Smooth transitions** for interactions
- **Hover effects** on nodes and buttons
- **Loading states** with spinners
- **Connection animations** for workflow flow

---

## 📁 **File Structure**
```
src/
├── components/
│   ├── workbench/
│   │   ├── WorkbenchCanvas.tsx      # Main canvas component
│   │   ├── WorkbenchSidebar.tsx     # Node palette
│   │   ├── WorkbenchToolbar.tsx     # Top toolbar
│   │   └── nodes/                   # Individual node components
│   │       ├── AgentNode.tsx
│   │       ├── ToolNode.tsx
│   │       ├── DecisionNode.tsx
│   │       └── ...
│   ├── ui/                          # Reusable UI components
│   └── chat/                        # AI assistant components
├── types/
│   └── workbench.ts                 # TypeScript definitions
├── pages/
│   ├── Index.tsx                    # Main workbench page
│   └── ApiSettings.tsx              # API configuration page
└── integrations/
    └── supabase/                    # Database integration
```

---

## 🚀 **Current Capabilities**

### **✅ What Works Now**
1. **Visual Workflow Builder** - Drag, drop, connect nodes
2. **Node Configuration** - Edit properties and settings
3. **Canvas Navigation** - Pan, zoom, grid snapping
4. **Workflow Import/Export** - Save and load workflows
5. **API Settings** - Configure multiple AI providers
6. **AI Chat Assistant** - Get help building workflows
7. **Responsive Design** - Works on different screen sizes
8. **Dark Theme** - Modern dark UI throughout
9. **🔥 Advanced Ollama Nodes** - Real-time performance monitoring **NEW**
10. **🔥 Model Management Dashboard** - Comprehensive model oversight **NEW**
11. **🔥 GPU Utilization Tracking** - Live system resource monitoring **NEW**
12. **🔥 Dynamic Model Configuration** - Advanced parameter tuning **NEW**

### **🎯 Ready for Enhancement**
1. **Workflow Execution** - Run workflows (needs implementation)
2. **Real-time Monitoring** - Track execution progress
3. **Database Integration** - Save workflows to Supabase
4. **User Authentication** - Multi-user support
5. **Workflow Templates** - Pre-built workflow examples
6. **Advanced Debugging** - Step-through execution
7. **Plugin System** - Custom node types
8. **Collaboration** - Multi-user editing

---

## 🛠️ **Development Status**

### **Stable & Working**
- ✅ Core UI components
- ✅ Node system architecture
- ✅ Canvas interactions
- ✅ Configuration panels
- ✅ API settings management
- ✅ Chat assistant integration

### **Development Server**
- **Running on**: `http://localhost:8083`
- **Hot reload**: Working perfectly
- **TypeScript**: No errors
- **Build system**: Optimized with Vite

---

## 🎯 **Next Steps for Enhancement**

1. **Workflow Execution Engine** - Implement actual workflow running
2. **Database Persistence** - Save workflows to Supabase
3. **User Authentication** - Add login/signup
4. **Workflow Templates** - Pre-built examples
5. **Advanced Node Types** - More specialized tools
6. **Real-time Collaboration** - Multi-user editing
7. **Workflow Marketplace** - Share and discover workflows

---

This is a **production-ready foundation** for an AI workflow builder with a beautiful, intuitive interface and solid architecture ready for advanced features!
