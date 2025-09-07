-- Enable pgvector extension for vector embeddings
CREATE EXTENSION IF NOT EXISTS vector;

-- Create enums for better type safety
CREATE TYPE public.node_type AS ENUM ('agent', 'tool', 'datasource', 'decision', 'slack', 'memory');
CREATE TYPE public.workflow_status AS ENUM ('draft', 'active', 'paused', 'archived');
CREATE TYPE public.run_status AS ENUM ('pending', 'running', 'completed', 'failed', 'cancelled');
CREATE TYPE public.event_type AS ENUM ('started', 'node_executed', 'edge_traversed', 'completed', 'failed', 'paused', 'resumed');
CREATE TYPE public.fga_relation_type AS ENUM ('can_access', 'can_write', 'can_execute', 'can_manage', 'member_of');
CREATE TYPE public.schedule_type AS ENUM ('once', 'interval', 'cron');

-- Workbench Workflows
CREATE TABLE public.workbench_workflows (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL,
  description TEXT,
  version INTEGER NOT NULL DEFAULT 1,
  status workflow_status NOT NULL DEFAULT 'draft',
  graph_data JSONB NOT NULL DEFAULT '{}',
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  published_at TIMESTAMPTZ,
  archived_at TIMESTAMPTZ
);

-- Workbench Nodes
CREATE TABLE public.workbench_nodes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workbench_workflows(id) ON DELETE CASCADE,
  node_id TEXT NOT NULL, -- React Flow node id
  node_type node_type NOT NULL,
  name TEXT NOT NULL,
  position_x FLOAT NOT NULL DEFAULT 0,
  position_y FLOAT NOT NULL DEFAULT 0,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, node_id)
);

-- Workbench Edges
CREATE TABLE public.workbench_edges (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workbench_workflows(id) ON DELETE CASCADE,
  edge_id TEXT NOT NULL, -- React Flow edge id
  source_node_id TEXT NOT NULL,
  target_node_id TEXT NOT NULL,
  source_handle TEXT,
  target_handle TEXT,
  config JSONB NOT NULL DEFAULT '{}',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(workflow_id, edge_id),
  FOREIGN KEY (workflow_id, source_node_id) REFERENCES public.workbench_nodes(workflow_id, node_id) ON DELETE CASCADE,
  FOREIGN KEY (workflow_id, target_node_id) REFERENCES public.workbench_nodes(workflow_id, node_id) ON DELETE CASCADE
);

-- Workflow Runs (Temporal integration)
CREATE TABLE public.workflow_runs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workbench_workflows(id) ON DELETE CASCADE,
  workflow_version INTEGER NOT NULL,
  temporal_workflow_id TEXT,
  temporal_run_id TEXT,
  status run_status NOT NULL DEFAULT 'pending',
  input_data JSONB DEFAULT '{}',
  output_data JSONB DEFAULT '{}',
  error_message TEXT,
  started_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  completed_at TIMESTAMPTZ,
  duration_ms INTEGER
);

-- Workflow Events (execution tracking)
CREATE TABLE public.workflow_events (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id UUID NOT NULL REFERENCES public.workflow_runs(id) ON DELETE CASCADE,
  event_type event_type NOT NULL,
  node_id TEXT,
  event_data JSONB DEFAULT '{}',
  timestamp TIMESTAMPTZ NOT NULL DEFAULT now(),
  sequence_number INTEGER NOT NULL
);

-- OpenFGA Relations
CREATE TABLE public.fga_relations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  subject_type TEXT NOT NULL, -- 'user', 'role', 'group'
  subject_id UUID NOT NULL,
  relation fga_relation_type NOT NULL,
  object_type TEXT NOT NULL, -- 'workflow', 'node', 'tool', 'datasource'
  object_id UUID NOT NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ,
  UNIQUE(subject_type, subject_id, relation, object_type, object_id)
);

-- Slack Integrations
CREATE TABLE public.slack_integrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workspace_id TEXT NOT NULL,
  workspace_name TEXT NOT NULL,
  bot_token_encrypted TEXT NOT NULL, -- encrypted OAuth token
  app_id TEXT NOT NULL,
  team_id TEXT NOT NULL,
  scope TEXT NOT NULL,
  channels JSONB DEFAULT '[]', -- array of channel objects
  webhook_url TEXT,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_verified_at TIMESTAMPTZ,
  active BOOLEAN NOT NULL DEFAULT true,
  UNIQUE(workspace_id, created_by)
);

-- Vector Memory Entries
CREATE TABLE public.memory_entries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  content TEXT NOT NULL,
  embedding vector(1536), -- OpenAI ada-002 dimension
  metadata JSONB DEFAULT '{}',
  tags TEXT[] DEFAULT '{}',
  source_type TEXT, -- 'workflow', 'conversation', 'document'
  source_id UUID,
  workflow_id UUID REFERENCES public.workbench_workflows(id) ON DELETE SET NULL,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at TIMESTAMPTZ
);

-- Workflow Schedules
CREATE TABLE public.workflow_schedules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  workflow_id UUID NOT NULL REFERENCES public.workbench_workflows(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  schedule_type schedule_type NOT NULL,
  cron_expression TEXT, -- for cron schedules
  interval_seconds INTEGER, -- for interval schedules
  scheduled_at TIMESTAMPTZ, -- for once schedules
  input_data JSONB DEFAULT '{}',
  timezone TEXT NOT NULL DEFAULT 'UTC',
  active BOOLEAN NOT NULL DEFAULT true,
  created_by UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  last_run_at TIMESTAMPTZ,
  next_run_at TIMESTAMPTZ
);

-- Create indexes for performance
CREATE INDEX idx_workbench_workflows_created_by ON public.workbench_workflows(created_by);
CREATE INDEX idx_workbench_workflows_status ON public.workbench_workflows(status);
CREATE INDEX idx_workbench_nodes_workflow_id ON public.workbench_nodes(workflow_id);
CREATE INDEX idx_workbench_edges_workflow_id ON public.workbench_edges(workflow_id);
CREATE INDEX idx_workflow_runs_workflow_id ON public.workflow_runs(workflow_id);
CREATE INDEX idx_workflow_runs_status ON public.workflow_runs(status);
CREATE INDEX idx_workflow_events_run_id ON public.workflow_events(run_id);
CREATE INDEX idx_fga_relations_subject ON public.fga_relations(subject_type, subject_id);
CREATE INDEX idx_fga_relations_object ON public.fga_relations(object_type, object_id);
CREATE INDEX idx_slack_integrations_created_by ON public.slack_integrations(created_by);
CREATE INDEX idx_memory_entries_embedding ON public.memory_entries USING ivfflat (embedding vector_cosine_ops) WITH (lists = 100);
CREATE INDEX idx_memory_entries_created_by ON public.memory_entries(created_by);
CREATE INDEX idx_memory_entries_workflow_id ON public.memory_entries(workflow_id);
CREATE INDEX idx_memory_entries_tags ON public.memory_entries USING GIN(tags);
CREATE INDEX idx_workflow_schedules_workflow_id ON public.workflow_schedules(workflow_id);
CREATE INDEX idx_workflow_schedules_next_run ON public.workflow_schedules(next_run_at) WHERE active = true;

-- Enable RLS on all tables
ALTER TABLE public.workbench_workflows ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbench_nodes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workbench_edges ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_runs ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.fga_relations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.slack_integrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.memory_entries ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.workflow_schedules ENABLE ROW LEVEL SECURITY;

-- Security definer function to check workflow access
CREATE OR REPLACE FUNCTION public.has_workflow_access(workflow_uuid UUID, required_permission fga_relation_type DEFAULT 'can_access')
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT EXISTS (
    SELECT 1 FROM public.fga_relations
    WHERE subject_type = 'user' 
      AND subject_id = auth.uid()
      AND relation = required_permission
      AND object_type = 'workflow'
      AND object_id = workflow_uuid
      AND (expires_at IS NULL OR expires_at > now())
  ) OR EXISTS (
    SELECT 1 FROM public.workbench_workflows
    WHERE id = workflow_uuid AND created_by = auth.uid()
  );
$$;

-- Security definer function to check admin role
CREATE OR REPLACE FUNCTION public.is_workflow_admin()
RETURNS BOOLEAN
LANGUAGE SQL
SECURITY DEFINER
STABLE
SET search_path = public
AS $$
  SELECT COALESCE(
    (SELECT role FROM public.profiles WHERE id = auth.uid()) = 'admin',
    false
  );
$$;

-- RLS Policies for Workbench Workflows
CREATE POLICY "Users can view workflows they have access to"
  ON public.workbench_workflows FOR SELECT
  USING (
    created_by = auth.uid() OR 
    public.has_workflow_access(id) OR 
    public.is_workflow_admin()
  );

CREATE POLICY "Users can create workflows"
  ON public.workbench_workflows FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update workflows they own or have manage access"
  ON public.workbench_workflows FOR UPDATE
  USING (
    created_by = auth.uid() OR 
    public.has_workflow_access(id, 'can_manage') OR 
    public.is_workflow_admin()
  );

CREATE POLICY "Users can delete workflows they own or have manage access"
  ON public.workbench_workflows FOR DELETE
  USING (
    created_by = auth.uid() OR 
    public.has_workflow_access(id, 'can_manage') OR 
    public.is_workflow_admin()
  );

-- RLS Policies for Workbench Nodes
CREATE POLICY "Users can view nodes of accessible workflows"
  ON public.workbench_nodes FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workbench_workflows w 
      WHERE w.id = workflow_id AND (
        w.created_by = auth.uid() OR 
        public.has_workflow_access(w.id) OR 
        public.is_workflow_admin()
      )
    )
  );

CREATE POLICY "Users can manage nodes of owned workflows"
  ON public.workbench_nodes FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workbench_workflows w 
      WHERE w.id = workflow_id AND (
        w.created_by = auth.uid() OR 
        public.has_workflow_access(w.id, 'can_manage') OR 
        public.is_workflow_admin()
      )
    )
  );

-- RLS Policies for Workbench Edges
CREATE POLICY "Users can view edges of accessible workflows"
  ON public.workbench_edges FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workbench_workflows w 
      WHERE w.id = workflow_id AND (
        w.created_by = auth.uid() OR 
        public.has_workflow_access(w.id) OR 
        public.is_workflow_admin()
      )
    )
  );

CREATE POLICY "Users can manage edges of owned workflows"
  ON public.workbench_edges FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.workbench_workflows w 
      WHERE w.id = workflow_id AND (
        w.created_by = auth.uid() OR 
        public.has_workflow_access(w.id, 'can_manage') OR 
        public.is_workflow_admin()
      )
    )
  );

-- RLS Policies for Workflow Runs
CREATE POLICY "Users can view runs of accessible workflows"
  ON public.workflow_runs FOR SELECT
  USING (
    started_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workbench_workflows w 
      WHERE w.id = workflow_id AND (
        w.created_by = auth.uid() OR 
        public.has_workflow_access(w.id) OR 
        public.is_workflow_admin()
      )
    )
  );

CREATE POLICY "Users can create runs for accessible workflows"
  ON public.workflow_runs FOR INSERT
  WITH CHECK (
    started_by = auth.uid() AND
    EXISTS (
      SELECT 1 FROM public.workbench_workflows w 
      WHERE w.id = workflow_id AND (
        w.created_by = auth.uid() OR 
        public.has_workflow_access(w.id, 'can_execute') OR 
        public.is_workflow_admin()
      )
    )
  );

-- RLS Policies for Workflow Events
CREATE POLICY "Users can view events of accessible runs"
  ON public.workflow_events FOR SELECT
  USING (
    EXISTS (
      SELECT 1 FROM public.workflow_runs r
      JOIN public.workbench_workflows w ON w.id = r.workflow_id
      WHERE r.id = run_id AND (
        r.started_by = auth.uid() OR
        w.created_by = auth.uid() OR 
        public.has_workflow_access(w.id) OR 
        public.is_workflow_admin()
      )
    )
  );

CREATE POLICY "System can insert workflow events"
  ON public.workflow_events FOR INSERT
  WITH CHECK (true);

-- RLS Policies for FGA Relations
CREATE POLICY "Admins can manage all relations"
  ON public.fga_relations FOR ALL
  USING (public.is_workflow_admin());

CREATE POLICY "Users can view relations they're subject of"
  ON public.fga_relations FOR SELECT
  USING (subject_type = 'user' AND subject_id = auth.uid());

-- RLS Policies for Slack Integrations
CREATE POLICY "Users can manage their own slack integrations"
  ON public.slack_integrations FOR ALL
  USING (created_by = auth.uid());

CREATE POLICY "Admins can view all slack integrations"
  ON public.slack_integrations FOR SELECT
  USING (public.is_workflow_admin());

-- RLS Policies for Memory Entries
CREATE POLICY "Users can view their own memory entries"
  ON public.memory_entries FOR SELECT
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workbench_workflows w 
      WHERE w.id = workflow_id AND (
        w.created_by = auth.uid() OR 
        public.has_workflow_access(w.id) OR 
        public.is_workflow_admin()
      )
    )
  );

CREATE POLICY "Users can create memory entries"
  ON public.memory_entries FOR INSERT
  WITH CHECK (created_by = auth.uid());

CREATE POLICY "Users can update their own memory entries"
  ON public.memory_entries FOR UPDATE
  USING (created_by = auth.uid());

-- RLS Policies for Workflow Schedules
CREATE POLICY "Users can manage schedules for accessible workflows"
  ON public.workflow_schedules FOR ALL
  USING (
    created_by = auth.uid() OR
    EXISTS (
      SELECT 1 FROM public.workbench_workflows w 
      WHERE w.id = workflow_id AND (
        w.created_by = auth.uid() OR 
        public.has_workflow_access(w.id, 'can_manage') OR 
        public.is_workflow_admin()
      )
    )
  );

-- Update triggers for timestamps
CREATE OR REPLACE FUNCTION public.update_workbench_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_workbench_workflows_updated_at
  BEFORE UPDATE ON public.workbench_workflows
  FOR EACH ROW EXECUTE FUNCTION public.update_workbench_updated_at();

CREATE TRIGGER update_workbench_nodes_updated_at
  BEFORE UPDATE ON public.workbench_nodes
  FOR EACH ROW EXECUTE FUNCTION public.update_workbench_updated_at();

CREATE TRIGGER update_slack_integrations_updated_at
  BEFORE UPDATE ON public.slack_integrations
  FOR EACH ROW EXECUTE FUNCTION public.update_workbench_updated_at();

CREATE TRIGGER update_memory_entries_updated_at
  BEFORE UPDATE ON public.memory_entries
  FOR EACH ROW EXECUTE FUNCTION public.update_workbench_updated_at();

CREATE TRIGGER update_workflow_schedules_updated_at
  BEFORE UPDATE ON public.workflow_schedules
  FOR EACH ROW EXECUTE FUNCTION public.update_workbench_updated_at();