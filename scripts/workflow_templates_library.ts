export const WORKFLOW_TEMPLATES: WorkflowTemplate[] = [
  // 🤖 AI AUTOMATION TEMPLATES
  {
    id: 'ai-content-moderation',
    name: 'AI Content Moderation Pipeline',
    description: 'Automatically moderate user-generated content using AI models with customizable filters and human review integration',
    category: 'ai-automation',
    difficulty: 'intermediate',
    estimatedTime: 45,
    tags: ['ai', 'moderation', 'content', 'automation', 'safety'],
    instructions: `
# AI Content Moderation Pipeline

## Overview
This workflow automatically moderates incoming content using AI models and takes appropriate actions based on the results.

## Setup Instructions
1. **Configure Webhook**: Set up a webhook endpoint to receive content submissions
2. **AI Model Setup**: Configure Ollama with a content moderation model (like llama-guard)
3. **Database**: Set up a database to log moderation results
4. **Email Alerts**: Configure SMTP settings for admin notifications

## Workflow Steps
1. **Content Webhook** - Receives new content submissions
2. **AI Moderator** - Analyzes content for inappropriate material
3. **Decision Node** - Routes based on moderation result
4. **Action Nodes** - Either approves content or flags for review
5. **Logging** - Records all moderation decisions

## Customization
- Adjust AI prompts for different moderation criteria
- Add additional decision branches for different content types
- Integrate with your existing content management system
    `,
    nodes: [
      {
        id: 'content-webhook',
        type: 'webhook',
        position: { x: 100, y: 200 },
        data: {
          label: 'Content Webhook',
          method: 'POST',
          url: '/api/content/submit',
          description: 'Receives new content submissions'
        }
      },
      {
        id: 'ai-moderator',
        type: 'ollama',
        position: { x: 350, y: 200 },
        data: {
          label: 'AI Content Moderator',
          model: 'llama-guard',
          prompt: 'Analyze the following content for inappropriate material, hate speech, spam, or harmful content. Respond with SAFE or UNSAFE and provide a brief explanation.',
          temperature: 0.1
        }
      },
      {
        id: 'moderation-decision',
        type: 'decision',
        position: { x: 600, y: 200 },
        data: {
          label: 'Content Safety Check',
          condition: 'output.includes("SAFE")',
          trueLabel: 'Approve',
          falseLabel: 'Flag for Review'
        }
      },
      {
        id: 'approve-content',
        type: 'database',
        position: { x: 800, y: 100 },
        data: {
          label: 'Approve Content',
          query: 'UPDATE content SET status = "approved" WHERE id = {{content_id}}',
          description: 'Marks content as approved'
        }
      },
      {
        id: 'flag-content',
        type: 'database',
        position: { x: 800, y: 300 },
        data: {
          label: 'Flag for Review',
          query: 'UPDATE content SET status = "flagged", reason = {{reason}} WHERE id = {{content_id}}',
          description: 'Flags content for human review'
        }
      },
      {
        id: 'admin-alert',
        type: 'email',
        position: { x: 1050, y: 300 },
        data: {
          label: 'Alert Admin',
          to: 'admin@company.com',
          subject: 'Content Flagged for Review',
          body: 'Content ID {{content_id}} has been flagged by AI moderation. Reason: {{reason}}'
        }
      },
      {
        id: 'log-result',
        type: 'database',
        position: { x: 1050, y: 200 },
        data: {
          label: 'Log Moderation',
          query: 'INSERT INTO moderation_log (content_id, result, ai_response, timestamp) VALUES ({{content_id}}, {{result}}, {{ai_response}}, NOW())',
          description: 'Logs moderation decision'
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'content-webhook', target: 'ai-moderator' },
      { id: 'e2', source: 'ai-moderator', target: 'moderation-decision' },
      { id: 'e3', source: 'moderation-decision', target: 'approve-content', sourceHandle: 'true' },
      { id: 'e4', source: 'moderation-decision', target: 'flag-content', sourceHandle: 'false' },
      { id: 'e5', source: 'flag-content', target: 'admin-alert' },
      { id: 'e6', source: 'approve-content', target: 'log-result' },
      { id: 'e7', source: 'flag-content', target: 'log-result' }
    ]
  },

  // 📊 DATA PROCESSING TEMPLATES
  {
    id: 'database-backup-sync',
    name: 'Database Backup & Cloud Sync',
    description: 'Automated database backup with compression, integrity checks, and cloud storage synchronization',
    category: 'data-processing',
    difficulty: 'advanced',
    estimatedTime: 30,
    tags: ['database', 'backup', 'sync', 'automation', 'cloud'],
    instructions: `
# Database Backup & Cloud Sync

## Overview
Automated daily database backup with compression, integrity verification, and cloud storage upload.

## Setup Instructions
1. **Schedule Setup**: Configure the scheduler for your preferred backup time
2. **Database Access**: Ensure database credentials are configured
3. **Cloud Storage**: Set up cloud storage API credentials (AWS S3, Google Cloud, etc.)
4. **Notification**: Configure email settings for backup status reports

## Features
- Automated daily backups
- Data compression to save storage space
- Integrity verification of backup files
- Cloud storage synchronization
- Email notifications for success/failure
- Backup retention management

## Security
- All credentials are encrypted
- Backup files are compressed and can be encrypted
- Access logs are maintained for audit trails
    `,
    nodes: [
      {
        id: 'daily-scheduler',
        type: 'scheduler',
        position: { x: 100, y: 200 },
        data: {
          label: 'Daily Backup Trigger',
          schedule: '0 2 * * *', // 2 AM daily
          timezone: 'UTC'
        }
      },
      {
        id: 'create-backup',
        type: 'database',
        position: { x: 300, y: 200 },
        data: {
          label: 'Create DB Backup',
          operation: 'backup',
          database: 'production',
          format: 'sql',
          includeData: true
        }
      },
      {
        id: 'compress-backup',
        type: 'file',
        position: { x: 500, y: 200 },
        data: {
          label: 'Compress Backup',
          operation: 'compress',
          format: 'gzip',
          compressionLevel: 6
        }
      },
      {
        id: 'verify-integrity',
        type: 'file',
        position: { x: 700, y: 200 },
        data: {
          label: 'Verify Integrity',
          operation: 'checksum',
          algorithm: 'sha256'
        }
      },
      {
        id: 'upload-to-cloud',
        type: 'webhook',
        position: { x: 900, y: 200 },
        data: {
          label: 'Upload to Cloud',
          method: 'PUT',
          url: 'https://api.storage.provider.com/upload',
          headers: { 'Authorization': 'Bearer {{cloud_token}}' }
        }
      },
      {
        id: 'cleanup-old-backups',
        type: 'file',
        position: { x: 1100, y: 150 },
        data: {
          label: 'Cleanup Old Backups',
          operation: 'delete',
          retentionDays: 30
        }
      },
      {
        id: 'backup-success-notification',
        type: 'email',
        position: { x: 1100, y: 250 },
        data: {
          label: 'Success Notification',
          to: 'admin@company.com',
          subject: 'Database Backup Completed Successfully',
          body: 'Daily backup completed. File: {{backup_filename}}, Size: {{file_size}}, Cloud URL: {{cloud_url}}'
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'daily-scheduler', target: 'create-backup' },
      { id: 'e2', source: 'create-backup', target: 'compress-backup' },
      { id: 'e3', source: 'compress-backup', target: 'verify-integrity' },
      { id: 'e4', source: 'verify-integrity', target: 'upload-to-cloud' },
      { id: 'e5', source: 'upload-to-cloud', target: 'cleanup-old-backups' },
      { id: 'e6', source: 'cleanup-old-backups', target: 'backup-success-notification' }
    ]
  },

  // 📺 MONITORING TEMPLATES
  {
    id: 'social-media-monitor',
    name: 'Social Media Brand Monitor',
    description: 'Monitor social media mentions, analyze sentiment, and alert on important brand mentions or negative feedback',
    category: 'monitoring',
    difficulty: 'beginner',
    estimatedTime: 20,
    tags: ['social', 'monitoring', 'sentiment', 'alerts', 'brand'],
    instructions: `
# Social Media Brand Monitor

## Overview
Automatically monitor social media platforms for brand mentions and analyze sentiment in real-time.

## Setup Instructions
1. **Social API Keys**: Configure API access for Twitter, Instagram, Facebook, etc.
2. **Keywords**: Set up brand keywords and hashtags to monitor
3. **AI Sentiment**: Configure AI model for sentiment analysis
4. **Alert Thresholds**: Set sensitivity levels for notifications

## Features
- Real-time social media monitoring
- AI-powered sentiment analysis
- Configurable alert thresholds
- Trend analysis and reporting
- Multi-platform support

## Use Cases
- Brand reputation monitoring
- Customer service alerts
- Competitor analysis
- Crisis management
- Marketing campaign tracking
    `,
    nodes: [
      {
        id: 'social-webhook',
        type: 'webhook',
        position: { x: 100, y: 200 },
        data: {
          label: 'Social Media API',
          method: 'GET',
          url: 'https://api.social-platform.com/mentions',
          schedule: '*/5 * * * *', // Every 5 minutes
          keywords: ['YourBrand', '#yourbrand', '@yourbrand']
        }
      },
      {
        id: 'sentiment-analysis',
        type: 'agent',
        position: { x: 350, y: 200 },
        data: {
          label: 'Sentiment Analysis',
          provider: 'ollama',
          model: 'llama2',
          prompt: 'Analyze the sentiment of this social media post about our brand. Rate it as POSITIVE, NEGATIVE, or NEUTRAL and provide a confidence score.'
        }
      },
      {
        id: 'sentiment-decision',
        type: 'decision',
        position: { x: 600, y: 200 },
        data: {
          label: 'Sentiment Check',
          condition: 'sentiment === "NEGATIVE" && confidence > 0.8',
          trueLabel: 'Alert Team',
          falseLabel: 'Log Only'
        }
      },
      {
        id: 'urgent-alert',
        type: 'email',
        position: { x: 850, y: 100 },
        data: {
          label: 'Urgent Alert',
          to: 'social-team@company.com',
          subject: '🚨 Negative Brand Mention Alert',
          body: 'Negative mention detected:\n\nPost: {{post_content}}\nPlatform: {{platform}}\nSentiment: {{sentiment}}\nConfidence: {{confidence}}\nLink: {{post_url}}'
        }
      },
      {
        id: 'log-mention',
        type: 'database',
        position: { x: 850, y: 300 },
        data: {
          label: 'Log Mention',
          query: 'INSERT INTO social_mentions (platform, content, sentiment, confidence, url, timestamp) VALUES ({{platform}}, {{content}}, {{sentiment}}, {{confidence}}, {{url}}, NOW())'
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'social-webhook', target: 'sentiment-analysis' },
      { id: 'e2', source: 'sentiment-analysis', target: 'sentiment-decision' },
      { id: 'e3', source: 'sentiment-decision', target: 'urgent-alert', sourceHandle: 'true' },
      { id: 'e4', source: 'sentiment-decision', target: 'log-mention', sourceHandle: 'false' },
      { id: 'e5', source: 'urgent-alert', target: 'log-mention' }
    ]
  },

  // 📧 COMMUNICATION TEMPLATES
  {
    id: 'customer-email-automation',
    name: 'Personalized Customer Email Campaigns',
    description: 'AI-powered personalized email campaigns based on customer behavior, preferences, and purchase history',
    category: 'communication',
    difficulty: 'intermediate',
    estimatedTime: 35,
    tags: ['email', 'marketing', 'personalization', 'ai', 'customer'],
    instructions: `
# Personalized Customer Email Campaigns

## Overview
Create and send personalized email campaigns using AI to analyze customer data and generate tailored content.

## Setup Instructions
1. **Customer Database**: Connect to your customer database
2. **Email Provider**: Configure SMTP or email service provider
3. **AI Model**: Set up AI model for content personalization
4. **Templates**: Create base email templates for personalization

## Features
- AI-powered content personalization
- Customer segmentation based on behavior
- A/B testing capabilities
- Performance tracking and analytics
- Automated follow-up sequences

## Personalization Factors
- Purchase history
- Browsing behavior
- Demographics
- Engagement patterns
- Seasonal preferences
    `,
    nodes: [
      {
        id: 'get-customers',
        type: 'database',
        position: { x: 100, y: 200 },
        data: {
          label: 'Get Customer Data',
          query: 'SELECT * FROM customers WHERE email_opt_in = true AND last_purchase_date > DATE_SUB(NOW(), INTERVAL 90 DAY)',
          description: 'Retrieve active customers for campaign'
        }
      },
      {
        id: 'analyze-customer',
        type: 'agent',
        position: { x: 350, y: 200 },
        data: {
          label: 'Analyze Customer Profile',
          provider: 'ollama',
          model: 'llama2',
          prompt: 'Analyze this customer profile and suggest personalized email content: Purchase history: {{purchase_history}}, Preferences: {{preferences}}, Last activity: {{last_activity}}'
        }
      },
      {
        id: 'generate-content',
        type: 'agent',
        position: { x: 600, y: 200 },
        data: {
          label: 'Generate Email Content',
          provider: 'ollama',
          model: 'llama2',
          prompt: 'Create a personalized email for this customer based on the analysis. Include relevant product recommendations and a compelling subject line.'
        }
      },
      {
        id: 'send-email',
        type: 'email',
        position: { x: 850, y: 200 },
        data: {
          label: 'Send Personalized Email',
          to: '{{customer_email}}',
          subject: '{{generated_subject}}',
          body: '{{generated_content}}',
          tracking: true
        }
      },
      {
        id: 'track-sending',
        type: 'database',
        position: { x: 1100, y: 200 },
        data: {
          label: 'Track Email Sent',
          query: 'INSERT INTO email_campaigns (customer_id, subject, content, sent_at, campaign_id) VALUES ({{customer_id}}, {{subject}}, {{content}}, NOW(), {{campaign_id}})'
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'get-customers', target: 'analyze-customer' },
      { id: 'e2', source: 'analyze-customer', target: 'generate-content' },
      { id: 'e3', source: 'generate-content', target: 'send-email' },
      { id: 'e4', source: 'send-email', target: 'track-sending' }
    ]
  },

  // 🔄 ADVANCED DATA PROCESSING
  {
    id: 'data-pipeline-etl',
    name: 'Advanced ETL Data Pipeline',
    description: 'Extract, transform, and load data from multiple sources with validation, error handling, and data quality checks',
    category: 'data-processing',
    difficulty: 'advanced',
    estimatedTime: 50,
    tags: ['etl', 'data', 'pipeline', 'validation', 'transformation'],
    instructions: `
# Advanced ETL Data Pipeline

## Overview
Comprehensive data pipeline that extracts data from multiple sources, applies transformations, validates quality, and loads into target systems.

## Setup Instructions
1. **Data Sources**: Configure connections to source systems (APIs, databases, files)
2. **Transformation Rules**: Define data transformation and cleansing rules
3. **Validation Rules**: Set up data quality validation criteria
4. **Target Systems**: Configure destination databases or data warehouses
5. **Error Handling**: Set up error notification and recovery procedures

## Features
- Multi-source data extraction
- Advanced data transformations
- Data quality validation
- Error handling and retry logic
- Performance monitoring
- Data lineage tracking

## Data Quality Checks
- Completeness validation
- Format consistency
- Range and constraint validation
- Duplicate detection
- Referential integrity checks
    `,
    nodes: [
      {
        id: 'extract-api-data',
        type: 'webhook',
        position: { x: 100, y: 150 },
        data: {
          label: 'Extract API Data',
          method: 'GET',
          url: 'https://api.source1.com/data',
          headers: { 'Authorization': 'Bearer {{api_token}}' }
        }
      },
      {
        id: 'extract-db-data',
        type: 'database',
        position: { x: 100, y: 250 },
        data: {
          label: 'Extract DB Data',
          query: 'SELECT * FROM source_table WHERE updated_at > {{last_sync_time}}',
          database: 'source_db'
        }
      },
      {
        id: 'extract-file-data',
        type: 'file',
        position: { x: 100, y: 350 },
        data: {
          label: 'Extract File Data',
          operation: 'read',
          path: '/data/imports/*.csv',
          format: 'csv'
        }
      },
      {
        id: 'merge-data',
        type: 'agent',
        position: { x: 350, y: 250 },
        data: {
          label: 'Merge Data Sources',
          provider: 'ollama',
          model: 'llama2',
          prompt: 'Merge and standardize data from multiple sources. Resolve conflicts and ensure consistent formatting.'
        }
      },
      {
        id: 'validate-data',
        type: 'agent',
        position: { x: 600, y: 250 },
        data: {
          label: 'Validate Data Quality',
          provider: 'ollama',
          model: 'llama2',
          prompt: 'Validate data quality: check for completeness, format consistency, duplicates, and business rule compliance.'
        }
      },
      {
        id: 'quality-decision',
        type: 'decision',
        position: { x: 850, y: 250 },
        data: {
          label: 'Quality Check',
          condition: 'validation_score > 0.95',
          trueLabel: 'Load Data',
          falseLabel: 'Flag Issues'
        }
      },
      {
        id: 'load-to-warehouse',
        type: 'database',
        position: { x: 1100, y: 150 },
        data: {
          label: 'Load to Data Warehouse',
          operation: 'bulk_insert',
          table: 'fact_table',
          database: 'data_warehouse'
        }
      },
      {
        id: 'quality-alert',
        type: 'email',
        position: { x: 1100, y: 350 },
        data: {
          label: 'Data Quality Alert',
          to: 'data-team@company.com',
          subject: 'Data Quality Issues Detected',
          body: 'Data quality validation failed. Issues: {{validation_issues}}'
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'extract-api-data', target: 'merge-data' },
      { id: 'e2', source: 'extract-db-data', target: 'merge-data' },
      { id: 'e3', source: 'extract-file-data', target: 'merge-data' },
      { id: 'e4', source: 'merge-data', target: 'validate-data' },
      { id: 'e5', source: 'validate-data', target: 'quality-decision' },
      { id: 'e6', source: 'quality-decision', target: 'load-to-warehouse', sourceHandle: 'true' },
      { id: 'e7', source: 'quality-decision', target: 'quality-alert', sourceHandle: 'false' }
    ]
  },

  // 🤖 AI AUTOMATION - CUSTOMER SERVICE
  {
    id: 'ai-customer-service',
    name: 'AI-Powered Customer Service',
    description: 'Intelligent customer service automation with AI chat, ticket routing, and escalation management',
    category: 'ai-automation',
    difficulty: 'advanced',
    estimatedTime: 60,
    tags: ['ai', 'customer-service', 'chatbot', 'routing', 'escalation'],
    instructions: `
# AI-Powered Customer Service

## Overview
Complete customer service automation using AI for initial response, intelligent routing, and escalation management.

## Setup Instructions
1. **AI Models**: Configure AI models for chat and classification
2. **Knowledge Base**: Set up customer service knowledge base
3. **Routing Rules**: Define ticket routing and escalation rules
4. **Integration**: Connect with existing CRM and ticketing systems
5. **Human Handoff**: Configure seamless handoff to human agents

## Features
- AI-powered initial customer response
- Intelligent ticket classification and routing
- Automated escalation based on urgency/complexity
- Knowledge base integration
- Sentiment analysis for priority handling
- Performance analytics and reporting

## AI Capabilities
- Natural language understanding
- Intent classification
- Sentiment analysis
- Knowledge retrieval
- Response generation
- Escalation prediction
    `,
    nodes: [
      {
        id: 'customer-inquiry',
        type: 'webhook',
        position: { x: 100, y: 250 },
        data: {
          label: 'Customer Inquiry',
          method: 'POST',
          url: '/api/support/inquiry',
          description: 'Receives customer support requests'
        }
      },
      {
        id: 'classify-intent',
        type: 'agent',
        position: { x: 300, y: 250 },
        data: {
          label: 'Classify Intent',
          provider: 'ollama',
          model: 'llama2',
          prompt: 'Classify this customer inquiry intent: BILLING, TECHNICAL, GENERAL, COMPLAINT, REFUND. Also determine urgency: LOW, MEDIUM, HIGH, CRITICAL.'
        }
      },
      {
        id: 'sentiment-analysis',
        type: 'agent',
        position: { x: 500, y: 200 },
        data: {
          label: 'Analyze Sentiment',
          provider: 'ollama',
          model: 'llama2',
          prompt: 'Analyze customer sentiment: POSITIVE, NEUTRAL, NEGATIVE, ANGRY. Provide confidence score.'
        }
      },
      {
        id: 'knowledge-search',
        type: 'agent',
        position: { x: 500, y: 300 },
        data: {
          label: 'Search Knowledge Base',
          provider: 'ollama',
          model: 'llama2',
          prompt: 'Search knowledge base for relevant solutions to this customer inquiry: {{inquiry_text}}'
        }
      },
      {
        id: 'routing-decision',
        type: 'decision',
        position: { x: 700, y: 250 },
        data: {
          label: 'Routing Decision',
          condition: 'urgency === "CRITICAL" || sentiment === "ANGRY"',
          trueLabel: 'Human Agent',
          falseLabel: 'AI Response'
        }
      },
      {
        id: 'ai-response',
        type: 'agent',
        position: { x: 900, y: 350 },
        data: {
          label: 'Generate AI Response',
          provider: 'ollama',
          model: 'llama2',
          prompt: 'Generate helpful customer service response based on knowledge base results: {{kb_results}}'
        }
      },
      {
        id: 'escalate-to-human',
        type: 'email',
        position: { x: 900, y: 150 },
        data: {
          label: 'Escalate to Human',
          to: 'support-team@company.com',
          subject: 'Urgent Customer Inquiry - {{intent}}',
          body: 'Customer: {{customer_email}}\nInquiry: {{inquiry_text}}\nSentiment: {{sentiment}}\nUrgency: {{urgency}}'
        }
      },
      {
        id: 'send-response',
        type: 'email',
        position: { x: 1150, y: 300 },
        data: {
          label: 'Send Response',
          to: '{{customer_email}}',
          subject: 'Re: Your Support Inquiry',
          body: '{{ai_response}}'
        }
      },
      {
        id: 'create-ticket',
        type: 'database',
        position: { x: 1150, y: 200 },
        data: {
          label: 'Create Support Ticket',
          query: 'INSERT INTO support_tickets (customer_email, intent, urgency, sentiment, status, created_at) VALUES ({{customer_email}}, {{intent}}, {{urgency}}, {{sentiment}}, "open", NOW())'
        }
      }
    ],
    edges: [
      { id: 'e1', source: 'customer-inquiry', target: 'classify-intent' },
      { id: 'e2', source: 'classify-intent', target: 'sentiment-analysis' },
      { id: 'e3', source: 'classify-intent', target: 'knowledge-search' },
      { id: 'e4', source: 'sentiment-analysis', target: 'routing-decision' },
      { id: 'e5', source: 'knowledge-search', target: 'routing-decision' },
      { id: 'e6', source: 'routing-decision', target: 'escalate-to-human', sourceHandle: 'true' },
      { id: 'e7', source: 'routing-decision', target: 'ai-response', sourceHandle: 'false' },
      { id: 'e8', source: 'ai-response', target: 'send-response' },
      { id: 'e9', source: 'escalate-to-human', target: 'create-ticket' },
      { id: 'e10', source: 'send-response', target: 'create-ticket' }
    ]
  }
];

// Template categories for organization
export const TEMPLATE_CATEGORIES = {
  'ai-automation': {
    name: 'AI Automation',
    description: 'Intelligent workflows powered by AI models',
    icon: '🤖',
    color: 'bg-purple-500'
  },
  'data-processing': {
    name: 'Data Processing',
    description: 'ETL, analytics, and data transformation workflows',
    icon: '📊',
    color: 'bg-blue-500'
  },
  'communication': {
    name: 'Communication',
    description: 'Email, messaging, and notification workflows',
    icon: '📧',
    color: 'bg-green-500'
  },
  'monitoring': {
    name: 'Monitoring',
    description: 'System monitoring, alerts, and health checks',
    icon: '📺',
    color: 'bg-orange-500'
  },
  'custom': {
    name: 'Custom',
    description: 'User-created and specialized workflows',
    icon: '⚙️',
    color: 'bg-gray-500'
  }
};

// Template utility functions
export class WorkflowTemplateService {
  static getTemplatesByCategory(category: string): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(template => template.category === category);
  }

  static getTemplatesByDifficulty(difficulty: string): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(template => template.difficulty === difficulty);
  }

  static getTemplatesByTags(tags: string[]): WorkflowTemplate[] {
    return WORKFLOW_TEMPLATES.filter(template => 
      tags.some(tag => template.tags.includes(tag))
    );
  }

  static searchTemplates(query: string): WorkflowTemplate[] {
    const searchTerm = query.toLowerCase();
    return WORKFLOW_TEMPLATES.filter(template =>
      template.name.toLowerCase().includes(searchTerm) ||
      template.description.toLowerCase().includes(searchTerm) ||
      template.tags.some(tag => tag.toLowerCase().includes(searchTerm))
    );
  }

  static getPopularTemplates(): WorkflowTemplate[] {
    // Return templates sorted by estimated usage (in real app, this would be based on actual usage data)
    return [...WORKFLOW_TEMPLATES].sort((a, b) => {
      const popularityScore = (template: WorkflowTemplate) => {
        // Simple popularity algorithm based on difficulty and category
        let score = 100;
        if (template.difficulty === 'beginner') score += 30;
        if (template.difficulty === 'intermediate') score += 20;
        if (template.category === 'ai-automation') score += 25;
        if (template.category === 'communication') score += 20;
        return score;
      };
      return popularityScore(b) - popularityScore(a);
    });
  }

  static getFeaturedTemplates(): WorkflowTemplate[] {
    // Return hand-picked featured templates
    return [
      'ai-content-moderation',
      'customer-email-automation',
      'social-media-monitor',
      'ai-customer-service'
    ].map(id => WORKFLOW_TEMPLATES.find(t => t.id === id)!).filter(Boolean);
  }

  static getTemplateById(id: string): WorkflowTemplate | undefined {
    return WORKFLOW_TEMPLATES.find(template => template.id === id);
  }

  static validateTemplate(template: WorkflowTemplate): { isValid: boolean, errors: string[] } {
    const errors: string[] = [];

    // Basic validation
    if (!template.name || template.name.trim().length === 0) {
      errors.push('Template name is required');
    }

    if (!template.description || template.description.trim().length === 0) {
      errors.push('Template description is required');
    }

    if (!template.nodes || template.nodes.length === 0) {
      errors.push('Template must have at least one node');
    }

    if (!template.category) {
      errors.push('Template category is required');
    }

    if (!template.difficulty) {
      errors.push('Template difficulty is required');
    }

    // Node validation
    if (template.nodes) {
      const nodeIds = new Set();
      for (const node of template.nodes) {
        if (!node.id || node.id.trim().length === 0) {
          errors.push('All nodes must have valid IDs');
        }
        
        if (nodeIds.has(node.id)) {
          errors.push(`Duplicate node ID: ${node.id}`);
        }
        nodeIds.add(node.id);

        if (!node.type) {
          errors.push(`Node ${node.id} must have a type`);
        }
      }
    }

    // Edge validation
    if (template.edges) {
      for (const edge of template.edges) {
        if (!edge.source || !edge.target) {
          errors.push('All edges must have source and target');
        }
        
        const sourceExists = template.nodes.some(n => n.id === edge.source);
        const targetExists = template.nodes.some(n => n.id === edge.target);
        
        if (!sourceExists) {
          errors.push(`Edge references non-existent source node: ${edge.source}`);
        }
        
        if (!targetExists) {
          errors.push(`Edge references non-existent target node: ${edge.target}`);
        }
      }
    }

    return {
      isValid: errors.length === 0,
      errors
    };
  }

  static createTemplateFromWorkflow(
    nodes: WorkflowNode[], 
    edges: WorkflowEdge[], 
    metadata: {
      name: string;
      description: string;
      category: string;
      difficulty: string;
      estimatedTime: number;
      tags: string[];
      instructions: string;
    }
  ): WorkflowTemplate {
    return {
      id: `custom_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      ...metadata,
      nodes,
      edges,
      category: metadata.category as any,
      difficulty: metadata.difficulty as any,
    };
  }

  static exportTemplate(template: WorkflowTemplate): string {
    const exportData = {
      version: '2.0',
      type: 'flameforge_template',
      template,
      exportedAt: new Date().toISOString(),
      exportedBy: 'FlameForge Nexus'
    };

    return JSON.stringify(exportData, null, 2);
  }

  static importTemplate(jsonData: string): WorkflowTemplate {
    try {
      const data = JSON.parse(jsonData);
      
      if (data.type !== 'flameforge_template') {
        throw new Error('Invalid template format');
      }

      const template = data.template;
      const validation = this.validateTemplate(template);
      
      if (!validation.isValid) {
        throw new Error(`Template validation failed: ${validation.errors.join(', ')}`);
      }

      // Generate new ID to avoid conflicts
      template.id = `imported_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
      
      return template;
    } catch (error) {
      throw new Error(`Failed to import template: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }
}

// Template installation helper
export class TemplateInstaller {
  static async installTemplate(
    templateId: string,
    customizations?: Partial<WorkflowTemplate>
  ): Promise<{ nodes: WorkflowNode[], edges: WorkflowEdge[] }> {
    const template = WorkflowTemplateService.getTemplateById(templateId);
    
    if (!template) {
      throw new Error(`Template not found: ${templateId}`);
    }

    // Apply customizations if provided
    const finalTemplate = customizations ? { ...template, ...customizations } : template;

    // Clone nodes and edges to avoid mutation
    const nodes = JSON.parse(JSON.stringify(finalTemplate.nodes));
    const edges = JSON.parse(JSON.stringify(finalTemplate.edges));

    // Apply any template-specific configurations
    await this.applyTemplateConfiguration(nodes, edges, finalTemplate);

    return { nodes, edges };
  }

  private static async applyTemplateConfiguration(
    nodes: WorkflowNode[], 
    edges: WorkflowEdge[], 
    template: WorkflowTemplate
  ): Promise<void> {
    // Apply default variables if they exist
    if (template.variables) {
      for (const node of nodes) {
        if (node.data) {
          // Replace template variables in node data
          for (const [key, value] of Object.entries(node.data)) {
            if (typeof value === 'string') {
              node.data[key] = this.replaceTemplateVariables(value, template.variables);
            }
          }
        }
      }
    }

    // Apply any template-specific node configurations
    if (template.configuration) {
      // This could include default retry settings, timeouts, etc.
      for (const node of nodes) {
        if (template.configuration.nodeDefaults) {
          node.data = {
            ...template.configuration.nodeDefaults,
            ...node.data
          };
        }
      }
    }
  }

  private static replaceTemplateVariables(text: string, variables: Record<string, any>): string {
    let result = text;
    for (const [key, value] of Object.entries(variables)) {
      const placeholder = `{{${key}}}`;
      result = result.replace(new RegExp(placeholder, 'g'), String(value));
    }
    return result;
  }
}

// Template marketplace data for seeding
export const TEMPLATE_MARKETPLACE_DATA = {
  categories: Object.entries(TEMPLATE_CATEGORIES).map(([key, value]) => ({
    id: key,
    ...value,
    templateCount: WORKFLOW_TEMPLATES.filter(t => t.category === key).length
  })),
  
  popularTags: [
    'ai', 'automation', 'email', 'database', 'monitoring', 
    'data', 'sentiment', 'backup', 'social', 'customer-service'
  ].map(tag => ({
    name: tag,
    count: WORKFLOW_TEMPLATES.filter(t => t.tags.includes(tag)).length
  })).sort((a, b) => b.count - a.count),

  stats: {
    totalTemplates: WORKFLOW_TEMPLATES.length,
    totalCategories: Object.keys(TEMPLATE_CATEGORIES).length,
    avgEstimatedTime: Math.round(
      WORKFLOW_TEMPLATES.reduce((sum, t) => sum + t.estimatedTime, 0) / WORKFLOW_TEMPLATES.length
    ),
    difficultyBreakdown: {
      beginner: WORKFLOW_TEMPLATES.filter(t => t.difficulty === 'beginner').length,
      intermediate: WORKFLOW_TEMPLATES.filter(t => t.difficulty === 'intermediate').length,
      advanced: WORKFLOW_TEMPLATES.filter(t => t.difficulty === 'advanced').length,
    }
  }
};

export default WORKFLOW_TEMPLATES;// Pre-built Workflow Templates for FlameForge Nexus
// Add to src/templates/workflowTemplates.ts

import { WorkflowNode, WorkflowEdge } from '@/types/workflow';

export interface WorkflowTemplate {
  id: string;
  name: string;
  description: string;
  category: 'data-processing' | 'ai-automation' | 'communication' | 'monitoring' | 'custom';
  difficulty: 'beginner' | 'intermediate' | 'advanced';
  estimatedTime: number; // minutes
  tags: string[];
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
  instructions: string;
  previewImage?: string;
  variables?: Record<string, any>;
  configuration?: any;
}

export const WORKFLOW_TEMPLATES