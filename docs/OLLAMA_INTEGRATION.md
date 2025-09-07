# Ollama Integration for FlameForge Nexus

## Overview

FlameForge Nexus now includes comprehensive integration with Ollama, enabling local AI model execution within your workflows. This integration provides a powerful alternative to cloud-based AI services, offering privacy, control, and cost-effectiveness for AI-powered automation.

## Features

### 🔥 **Core Capabilities**
- **Local AI Execution**: Run AI models locally using Ollama
- **Multi-Instance Support**: Connect to multiple Ollama instances
- **Auto-Discovery**: Automatically discover local Ollama installations
- **Real-time Monitoring**: Live connection status and health checks
- **Model Management**: Browse and manage available models
- **Visual Workflow Integration**: Drag-and-drop Ollama nodes in workflows
- **Execution Tracking**: Detailed logs and performance metrics

### 🎨 **Visual Components**
- **OllamaNode**: Specialized workflow node for AI model execution
- **OllamaManager**: Comprehensive management interface
- **Custom Edges**: Visual connections with execution status
- **Real-time Status**: Live connection indicators

## Quick Start

### Prerequisites
1. **Ollama Installation**: Install Ollama on your local machine
   ```bash
   # macOS/Linux
   curl -fsSL https://ollama.ai/install.sh | sh
   
   # Windows
   # Download from https://ollama.ai/download
   ```

2. **Start Ollama Service**
   ```bash
   ollama serve
   ```

3. **Pull a Model**
   ```bash
   ollama pull llama2
   ```

### Setup in FlameForge Nexus

1. **Navigate to API Settings**
   - Go to `/api-settings` in your FlameForge Nexus instance
   - Scroll to the "Ollama Integration" section

2. **Auto-Discovery**
   - Click "Discover" to automatically find local Ollama instances
   - Or manually add instances using the endpoint URL

3. **Add Ollama Node to Workflow**
   - Drag the "Ollama" node from the sidebar to your workflow canvas
   - Configure the model and parameters
   - Connect it to other nodes in your workflow

## Configuration

### Instance Management

**Add Instance Manually:**
```
Endpoint: http://localhost:11434
Name: Local Ollama (optional)
```

**Configuration Options:**
- `Auto-discovery`: Automatically find and monitor instances
- `Connection Timeout`: Timeout for connection attempts (ms)
- `Cache Timeout`: How long to cache connection status (ms)

### Node Configuration

**Basic Settings:**
- `Endpoint`: Ollama instance URL
- `Model`: Available model from the instance
- `System Prompt`: Instructions for the AI model

**Advanced Parameters:**
- `Temperature`: Creativity/randomness (0.0 - 2.0)
- `Max Tokens`: Maximum response length
- `Top P`: Nucleus sampling parameter
- `Top K`: Top-k sampling parameter

## API Reference

### REST API Endpoints

**Base URL**: `https://your-project.supabase.co/functions/v1/flameforge-api`

#### Instances
```http
GET /ollama/instances
POST /ollama/instances
DELETE /ollama/instances/{endpoint}
```

#### Models
```http
GET /ollama/models
```

#### Execution
```http
POST /ollama/execute
```

#### Logs
```http
GET /ollama/logs?workflow_id={id}&node_id={id}&status={status}
```

### Example API Usage

**List Instances:**
```bash
curl -X GET "https://your-project.supabase.co/functions/v1/flameforge-api/ollama/instances" \
  -H "X-API-Key: your-api-key"
```

**Execute Node:**
```bash
curl -X POST "https://your-project.supabase.co/functions/v1/flameforge-api/ollama/execute" \
  -H "X-API-Key: your-api-key" \
  -H "Content-Type: application/json" \
  -d '{
    "nodeId": "node-123",
    "workflowId": "workflow-456",
    "config": {
      "endpoint": "http://localhost:11434",
      "model": "llama2",
      "temperature": 0.7
    },
    "inputs": {
      "prompt": "Hello, how can you help me?"
    }
  }'
```

## React Hooks

### useOllamaContext
Access global Ollama state and configuration:
```typescript
const {
  instances,
  connectionStatuses,
  config,
  updateConfig,
  discoverInstances
} = useOllamaContext();
```

### useOllamaConnection
Monitor connection status for a specific endpoint:
```typescript
const { data: status, isLoading } = useOllamaConnection('http://localhost:11434');
```

### useOllamaModels
Get available models for an endpoint:
```typescript
const { data: models, isLoading } = useOllamaModels('http://localhost:11434');
```

### useBestOllamaInstance
Get the best available instance:
```typescript
const bestInstance = useBestOllamaInstance();
```

## Database Schema

### Tables Created
- `ollama_instances`: Track Ollama installations
- `ollama_model_cache`: Cache model information
- `ollama_execution_logs`: Detailed execution tracking

### Key Fields
```sql
-- ollama_instances
id, user_id, endpoint, name, is_active, last_seen, 
version, available_models, connection_metadata

-- ollama_execution_logs
id, user_id, workflow_id, node_id, instance_endpoint,
model_name, prompt_text, response_text, execution_time_ms,
tokens_generated, status, started_at, completed_at
```

## Troubleshooting

### Common Issues

**Connection Failed:**
- Ensure Ollama is running: `ollama serve`
- Check firewall settings
- Verify endpoint URL format

**No Models Available:**
- Pull models: `ollama pull llama2`
- Check model compatibility
- Refresh connection in FlameForge

**Execution Timeout:**
- Increase connection timeout in settings
- Check system resources
- Try smaller models

### Debug Mode
Enable debug logging by setting `VITE_DEBUG_MODE=true` in your environment.

## Performance Optimization

### Best Practices
1. **Model Selection**: Choose appropriate model sizes for your hardware
2. **Connection Pooling**: Limit concurrent connections per instance
3. **Caching**: Enable model and connection caching
4. **Resource Monitoring**: Monitor CPU/GPU usage during execution

### Recommended Models
- **Development**: `llama2:7b` (4GB RAM)
- **Production**: `llama2:13b` (8GB RAM)
- **Code Tasks**: `codellama:7b` (4GB RAM)
- **Lightweight**: `mistral:7b` (4GB RAM)

## Security Considerations

### Network Security
- Use HTTPS for remote Ollama instances
- Configure firewall rules appropriately
- Consider VPN for remote access

### Data Privacy
- All processing happens locally
- No data sent to external services
- Full control over model execution

## Advanced Usage

### Custom Models
```bash
# Create custom model
ollama create mymodel -f Modelfile

# Use in FlameForge
# Select "mymodel" in node configuration
```

### Docker Deployment
```yaml
version: '3.8'
services:
  ollama:
    image: ollama/ollama
    ports:
      - "11434:11434"
    volumes:
      - ollama:/root/.ollama
volumes:
  ollama:
```

## Support

For issues and questions:
- 📧 Email: james@godsimij-ai-solutions.com
- 🌐 Website: [GodsIMiJ AI Solutions](https://godsimij-ai-solutions.com)
- 📚 Documentation: Check the `/docs` folder for more guides

---

**Built with ❤️ by GodsIMiJ AI Solutions**
