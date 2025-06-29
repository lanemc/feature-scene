import { AlertCircle, ExternalLink, CheckCircle, XCircle } from 'lucide-react';
import styles from './InsightDetail.module.css';

interface InsightDetailProps {
  insight: any;
  onUpdateStatus: (status: string) => void;
  onCreateJira: () => void;
  isUpdating?: boolean;
  isCreatingJira?: boolean;
}

function InsightDetail({ 
  insight, 
  onUpdateStatus, 
  onCreateJira,
  isUpdating,
  isCreatingJira
}: InsightDetailProps) {
  const statusOptions = ['new', 'reviewed', 'in_progress', 'resolved', 'dismissed'];
  
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'resolved':
        return <CheckCircle size={16} />;
      case 'dismissed':
        return <XCircle size={16} />;
      default:
        return <AlertCircle size={16} />;
    }
  };

  return (
    <div className={styles.detail}>
      <div className={styles.header}>
        <div>
          <h2>{insight.title}</h2>
          <div className={styles.meta}>
            <span className={`${styles.priority} ${styles[insight.priority]}`}>
              {insight.priority} priority
            </span>
            <span className={styles.category}>{insight.category}</span>
            <span className={`${styles.status} ${styles[insight.status]}`}>
              {getStatusIcon(insight.status)}
              {insight.status}
            </span>
          </div>
        </div>
        
        <div className={styles.actions}>
          {!insight.jiraTicketId && (
            <button
              onClick={onCreateJira}
              disabled={isCreatingJira}
              className={styles.jiraButton}
            >
              {isCreatingJira ? 'Creating...' : 'Create Jira Ticket'}
            </button>
          )}
          
          {insight.jiraTicketId && (
            <a
              href={`#`}
              target="_blank"
              rel="noopener noreferrer"
              className={styles.jiraLink}
            >
              <ExternalLink size={16} />
              {insight.jiraTicketId}
            </a>
          )}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Summary</h3>
        <p>{insight.summary}</p>
      </div>

      <div className={styles.section}>
        <h3>Recommendation</h3>
        <p>{insight.recommendation}</p>
      </div>

      <div className={styles.section}>
        <h3>Expected Impact</h3>
        <p>{insight.impact}</p>
      </div>

      <div className={styles.section}>
        <h3>Metrics</h3>
        <div className={styles.metrics}>
          {Object.entries(insight.metrics || {}).map(([key, value]) => (
            <div key={key} className={styles.metric}>
              <span className={styles.metricLabel}>{key}:</span>
              <span className={styles.metricValue}>{String(value)}</span>
            </div>
          ))}
        </div>
      </div>

      <div className={styles.section}>
        <h3>Update Status</h3>
        <select
          value={insight.status}
          onChange={(e) => onUpdateStatus(e.target.value)}
          disabled={isUpdating}
          className={styles.statusSelect}
        >
          {statusOptions.map(status => (
            <option key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1).replace('_', ' ')}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.footer}>
        <span>Created: {new Date(insight.createdAt).toLocaleString()}</span>
        <span>Effort: {insight.effort}</span>
      </div>
    </div>
  );
}

export default InsightDetail;