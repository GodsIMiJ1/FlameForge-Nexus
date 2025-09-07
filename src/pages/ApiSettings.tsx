import { ApiKeyManager } from '@/components/api/ApiKeyManager';
import { OllamaManager } from '@/components/ollama/OllamaManager';

export default function ApiSettings() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">API Settings</h1>
        <p className="text-muted-foreground">
          Manage API keys and external integrations for FlameForge Nexus
        </p>
      </div>

      <div className="space-y-8">
        <ApiKeyManager />
        <OllamaManager />
      </div>
    </div>
  );
}