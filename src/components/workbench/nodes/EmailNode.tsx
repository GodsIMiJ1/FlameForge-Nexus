import React from 'react';
import { Handle, Position } from '@xyflow/react';
import { Mail, Send, Users, Paperclip, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '../../ui/card';
import { Badge } from '../../ui/badge';
import { Button } from '../../ui/button';

interface EmailNodeProps {
  data: {
    label?: string;
    description?: string;
    provider?: 'smtp' | 'sendgrid' | 'mailgun' | 'ses' | 'resend';
    to?: string[];
    cc?: string[];
    bcc?: string[];
    subject?: string;
    body?: string;
    attachments?: string[];
    status?: 'idle' | 'sending' | 'sent' | 'error';
    lastSent?: Date;
    deliveryStatus?: 'pending' | 'delivered' | 'bounced' | 'failed';
  };
  selected?: boolean;
}

export const EmailNode: React.FC<EmailNodeProps> = ({ data, selected }) => {
  const getProviderIcon = (provider: string) => {
    const iconClass = "w-4 h-4";
    switch (provider) {
      case 'sendgrid':
        return <div className={`${iconClass} bg-blue-500 rounded`} />;
      case 'mailgun':
        return <div className={`${iconClass} bg-red-500 rounded`} />;
      case 'ses':
        return <div className={`${iconClass} bg-orange-500 rounded`} />;
      case 'resend':
        return <div className={`${iconClass} bg-purple-500 rounded`} />;
      default:
        return <Mail className={iconClass} />;
    }
  };

  const getStatusColor = (status?: string) => {
    switch (status) {
      case 'sending':
        return 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300';
      case 'sent':
        return 'bg-green-100 text-green-700 dark:bg-green-900 dark:text-green-300';
      case 'error':
        return 'bg-red-100 text-red-700 dark:bg-red-900 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  };

  const getStatusIcon = (status?: string) => {
    switch (status) {
      case 'sending':
        return <Send className="w-3 h-3 animate-pulse" />;
      case 'sent':
        return <CheckCircle className="w-3 h-3" />;
      case 'error':
        return <AlertCircle className="w-3 h-3" />;
      default:
        return <Clock className="w-3 h-3" />;
    }
  };

  const getDeliveryStatusColor = (status?: string) => {
    switch (status) {
      case 'delivered':
        return 'text-green-600 dark:text-green-400';
      case 'bounced':
      case 'failed':
        return 'text-red-600 dark:text-red-400';
      case 'pending':
        return 'text-yellow-600 dark:text-yellow-400';
      default:
        return 'text-gray-600 dark:text-gray-400';
    }
  };

  const getTotalRecipients = () => {
    const to = data?.to?.length || 0;
    const cc = data?.cc?.length || 0;
    const bcc = data?.bcc?.length || 0;
    return to + cc + bcc;
  };

  return (
    <Card className={`min-w-[280px] ${selected ? 'ring-2 ring-blue-500' : ''} bg-gradient-to-br from-emerald-50 to-teal-50 border-emerald-200 dark:from-emerald-900/20 dark:to-teal-900/20 dark:border-emerald-700`}>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center justify-between text-sm">
          <div className="flex items-center gap-2">
            <Mail className="h-4 w-4 text-emerald-500" />
            <span className="font-semibold">{data?.label || 'Send Email'}</span>
            {data?.provider && (
              <Badge variant="secondary" className="text-xs bg-emerald-100 text-emerald-700 dark:bg-emerald-800 dark:text-emerald-200">
                {data.provider.toUpperCase()}
              </Badge>
            )}
          </div>
          {data?.status && (
            <Badge className={`text-xs ${getStatusColor(data.status)}`}>
              <div className="flex items-center gap-1">
                {getStatusIcon(data.status)}
                {data.status}
              </div>
            </Badge>
          )}
        </CardTitle>
        {data?.description && (
          <p className="text-xs text-muted-foreground">{data.description}</p>
        )}
      </CardHeader>

      <CardContent className="space-y-3">
        {/* Provider Info */}
        <div className="flex items-center gap-2 text-xs">
          {getProviderIcon(data?.provider || '')}
          <span className="text-muted-foreground">
            {data?.provider ? `${data.provider} provider` : 'No provider configured'}
          </span>
        </div>

        {/* Recipients */}
        <div className="flex items-center gap-2 text-xs">
          <Users className="w-4 h-4 text-muted-foreground" />
          <span className="text-muted-foreground">
            {getTotalRecipients() > 0 ? `${getTotalRecipients()} recipients` : 'No recipients'}
          </span>
        </div>

        {/* Subject Preview */}
        {data?.subject && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Subject:</div>
            <div className="text-xs text-muted-foreground truncate">
              {data.subject.length > 40 ? `${data.subject.substring(0, 40)}...` : data.subject}
            </div>
          </div>
        )}

        {/* Body Preview */}
        {data?.body && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Body:</div>
            <div className="text-xs text-muted-foreground">
              {data.body.length > 50 ? `${data.body.substring(0, 50)}...` : data.body}
            </div>
          </div>
        )}

        {/* Attachments */}
        {data?.attachments && data.attachments.length > 0 && (
          <div className="flex items-center gap-2 text-xs">
            <Paperclip className="w-4 h-4 text-muted-foreground" />
            <span className="text-muted-foreground">
              {data.attachments.length} attachment{data.attachments.length !== 1 ? 's' : ''}
            </span>
          </div>
        )}

        {/* Delivery Status */}
        {data?.deliveryStatus && data?.lastSent && (
          <div className="bg-muted rounded p-2">
            <div className="text-xs font-medium text-foreground mb-1">Delivery Status:</div>
            <div className={`text-xs font-medium ${getDeliveryStatusColor(data.deliveryStatus)}`}>
              {data.deliveryStatus.charAt(0).toUpperCase() + data.deliveryStatus.slice(1)}
            </div>
            <div className="text-xs text-muted-foreground mt-1">
              Last sent: {data.lastSent.toLocaleString()}
            </div>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex gap-2">
          <Button
            className="flex-1 h-8"
            size="sm"
            disabled={!data?.to?.length || !data?.subject || data?.status === 'sending'}
          >
            {data?.status === 'sending' ? (
              <Send className="h-3 w-3 mr-2 animate-pulse" />
            ) : (
              <Send className="h-3 w-3 mr-2" />
            )}
            {data?.status === 'sending' ? 'Sending...' : 'Send Email'}
          </Button>
        </div>
      </CardContent>

      <Handle type="target" position={Position.Left} className="w-3 h-3" />
      <Handle type="source" position={Position.Right} className="w-3 h-3" />
    </Card>
  );
};

EmailNode.displayName = 'EmailNode';
