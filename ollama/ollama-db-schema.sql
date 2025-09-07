-- Add Ollama-specific columns to workbench_nodes table
ALTER TABLE workbench_nodes 
ADD COLUMN IF NOT EXISTS node_type VARCHAR(50) DEFAULT 'default',
ADD COLUMN IF NOT EXISTS local_config JSONB DEFAULT '{}',
ADD COLUMN IF NOT EXISTS last_execution TIMESTAMP WITH TIME ZONE,
ADD COLUMN IF NOT EXISTS execution_status VARCHAR(20) DEFAULT 'idle',
ADD COLUMN IF NOT EXISTS output_data JSONB DEFAULT '{}';

-- Create index for node types
CREATE INDEX IF NOT EXISTS idx_workbench_nodes_type ON workbench_nodes(node_type);
CREATE INDEX IF NOT EXISTS idx_workbench_nodes_status ON workbench_nodes(execution_status);

-- Create ollama_instances table to track local Ollama installations
CREATE TABLE IF NOT EXISTS ollama_instances (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    endpoint VARCHAR(255) NOT NULL,
    name VARCHAR(100),
    is_active BOOLEAN DEFAULT true,
    last_seen TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    version VARCHAR(50),
    available_models JSONB DEFAULT '[]',
    connection_metadata JSONB DEFAULT '{}',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(user_id, endpoint)
);

-- Enable RLS on ollama_instances
ALTER TABLE ollama_instances ENABLE ROW LEVEL SECURITY;

-- RLS Policy for ollama_instances
CREATE POLICY "Users can manage their own ollama instances" ON ollama_instances
    FOR ALL USING (auth.uid() = user_id);

-- Create ollama_model_cache table for caching model information
CREATE TABLE IF NOT EXISTS ollama_model_cache (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    instance_id UUID REFERENCES ollama_instances(id) ON DELETE CASCADE,
    model_name VARCHAR(100) NOT NULL,
    model_size BIGINT,
    model_digest VARCHAR(255),
    model_details JSONB DEFAULT '{}',
    last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    UNIQUE(instance_id, model_name)
);

-- Enable RLS on ollama_model_cache
ALTER TABLE ollama_model_cache ENABLE ROW LEVEL SECURITY;

-- RLS Policy for ollama_model_cache (through instance ownership)
CREATE POLICY "Users can access models for their instances" ON ollama_model_cache
    FOR ALL USING (
        EXISTS (
            SELECT 1 FROM ollama_instances 
            WHERE ollama_instances.id = ollama_model_cache.instance_id 
            AND ollama_instances.user_id = auth.uid()
        )
    );

-- Create ollama_execution_logs table for detailed execution tracking
CREATE TABLE IF NOT EXISTS ollama_execution_logs (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    workflow_id UUID REFERENCES workbench_workflows(id) ON DELETE CASCADE,
    node_id UUID REFERENCES workbench_nodes(id) ON DELETE CASCADE,
    instance_endpoint VARCHAR(255) NOT NULL,
    model_name VARCHAR(100) NOT NULL,
    prompt_text TEXT,
    system_prompt TEXT,
    response_text TEXT,
    execution_time_ms INTEGER,
    tokens_generated INTEGER,
    prompt_tokens INTEGER,
    total_duration_ms BIGINT,
    load_duration_ms BIGINT,
    execution_config JSONB DEFAULT '{}',
    error_message TEXT,
    status VARCHAR(20) DEFAULT 'pending', -- pending, completed, error
    started_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    completed_at TIMESTAMP WITH TIME ZONE,
    
    -- Add constraints
    CONSTRAINT valid_status CHECK (status IN ('pending', 'completed', 'error'))
);

-- Enable RLS on ollama_execution_logs
ALTER TABLE ollama_execution_logs ENABLE ROW LEVEL SECURITY;

-- RLS Policy for ollama_execution_logs
CREATE POLICY "Users can access their own execution logs" ON ollama_execution_logs
    FOR ALL USING (auth.uid() = user_id);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_ollama_instances_user_active 
    ON ollama_instances(user_id, is_active);

CREATE INDEX IF NOT EXISTS idx_ollama_model_cache_instance 
    ON ollama_model_cache(instance_id);

CREATE INDEX IF NOT EXISTS idx_ollama_execution_logs_user_workflow 
    ON ollama_execution_logs(user_id, workflow_id);

CREATE INDEX IF NOT EXISTS idx_ollama_execution_logs_node_status 
    ON ollama_execution_logs(node_id, status);

CREATE INDEX IF NOT EXISTS idx_ollama_execution_logs_started 
    ON ollama_execution_logs(started_at DESC);

-- Update function for ollama_instances updated_at
CREATE OR REPLACE FUNCTION update_ollama_instances_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for updated_at
DROP TRIGGER IF EXISTS trigger_update_ollama_instances_updated_at ON ollama_instances;
CREATE TRIGGER trigger_update_ollama_instances_updated_at
    BEFORE UPDATE ON ollama_instances
    FOR EACH ROW
    EXECUTE FUNCTION update_ollama_instances_updated_at();

-- Function to cleanup old execution logs (optional - for maintenance)
CREATE OR REPLACE FUNCTION cleanup_old_ollama_logs()
RETURNS void AS $$
BEGIN
    DELETE FROM ollama_execution_logs 
    WHERE started_at < NOW() - INTERVAL '30 days';
END;
$$ LANGUAGE plpgsql;

-- Example query to get user's Ollama instances with model counts
/*
SELECT 
    oi.*,
    COUNT(omc.id) as model_count,
    array_agg(omc.model_name) FILTER (WHERE omc.model_name IS NOT NULL) as models
FROM ollama_instances oi
LEFT JOIN ollama_model_cache omc ON oi.id = omc.instance_id
WHERE oi.user_id = auth.uid()
AND oi.is_active = true
GROUP BY oi.id
ORDER BY oi.last_seen DESC;
*/

-- Example query to get execution statistics
/*
SELECT 
    node_id,
    COUNT(*) as total_executions,
    AVG(execution_time_ms) as avg_execution_time,
    AVG(tokens_generated) as avg_tokens_generated,
    COUNT(*) FILTER (WHERE status = 'completed') as successful_executions,
    COUNT(*) FILTER (WHERE status = 'error') as failed_executions
FROM ollama_execution_logs 
WHERE user_id = auth.uid()
AND started_at > NOW() - INTERVAL '7 days'
GROUP BY node_id;
*/