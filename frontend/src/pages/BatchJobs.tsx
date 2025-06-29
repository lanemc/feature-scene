import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { batchAPI } from '../services/api';
import { Play, RefreshCw, CheckCircle, XCircle, Clock } from 'lucide-react';
import styles from './BatchJobs.module.css';

function BatchJobs() {
  const queryClient = useQueryClient();

  const { data: status } = useQuery({
    queryKey: ['batch', 'status'],
    queryFn: () => batchAPI.getStatus(),
    refetchInterval: 2000, // Poll every 2 seconds when running
  });

  const { data: history } = useQuery({
    queryKey: ['batch', 'history'],
    queryFn: () => batchAPI.getHistory(20),
  });

  const runBatchMutation = useMutation({
    mutationFn: (force: boolean) => batchAPI.run(force),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['batch'] });
    },
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'running':
        return <RefreshCw className={styles.spinning} size={20} />;
      case 'completed':
        return <CheckCircle size={20} />;
      case 'failed':
        return <XCircle size={20} />;
      default:
        return <Clock size={20} />;
    }
  };

  const formatDuration = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);
    
    if (hours > 0) {
      return `${hours}h ${minutes % 60}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds % 60}s`;
    } else {
      return `${seconds}s`;
    }
  };

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Batch Jobs</h1>
        <button
          onClick={() => runBatchMutation.mutate(false)}
          disabled={status?.status === 'running' || runBatchMutation.isPending}
          className={styles.runButton}
        >
          <Play size={16} />
          {runBatchMutation.isPending ? 'Starting...' : 'Run Batch Job'}
        </button>
      </div>

      {status && status.status !== 'idle' && (
        <div className={styles.currentJob}>
          <h2>Current Job</h2>
          <div className={`${styles.jobCard} ${styles[status.status]}`}>
            <div className={styles.jobHeader}>
              <div className={styles.jobStatus}>
                {getStatusIcon(status.status)}
                <span>{status.status}</span>
              </div>
              <span className={styles.jobId}>{status.id}</span>
            </div>
            
            {status.metrics && (
              <div className={styles.metrics}>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Events Processed</span>
                  <span className={styles.metricValue}>
                    {status.metrics.eventsProcessed || 0}
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Pain Points</span>
                  <span className={styles.metricValue}>
                    {status.metrics.painPointsDetected || 0}
                  </span>
                </div>
                <div className={styles.metric}>
                  <span className={styles.metricLabel}>Insights Generated</span>
                  <span className={styles.metricValue}>
                    {status.metrics.insightsGenerated || 0}
                  </span>
                </div>
                {status.metrics.duration && (
                  <div className={styles.metric}>
                    <span className={styles.metricLabel}>Duration</span>
                    <span className={styles.metricValue}>
                      {formatDuration(status.metrics.duration)}
                    </span>
                  </div>
                )}
              </div>
            )}

            {status.error && (
              <div className={styles.error}>
                <h4>Error:</h4>
                <p>{status.error}</p>
              </div>
            )}

            <div className={styles.jobFooter}>
              <span>Started: {new Date(status.startedAt).toLocaleString()}</span>
              {status.completedAt && (
                <span>Completed: {new Date(status.completedAt).toLocaleString()}</span>
              )}
            </div>
          </div>
        </div>
      )}

      <div className={styles.history}>
        <h2>Job History</h2>
        {history?.history && history.history.length > 0 ? (
          <div className={styles.historyList}>
            {history.history.map((job: any) => (
              <div 
                key={job.id} 
                className={`${styles.historyItem} ${styles[job.status]}`}
              >
                <div className={styles.historyHeader}>
                  <div className={styles.jobStatus}>
                    {getStatusIcon(job.status)}
                    <span>{job.status}</span>
                  </div>
                  <span className={styles.historyDate}>
                    {new Date(job.startedAt).toLocaleString()}
                  </span>
                </div>
                
                {job.metrics && (
                  <div className={styles.historySummary}>
                    <span>Events: {job.metrics.eventsProcessed || 0}</span>
                    <span>Pain Points: {job.metrics.painPointsDetected || 0}</span>
                    <span>Insights: {job.metrics.insightsGenerated || 0}</span>
                    {job.metrics.duration && (
                      <span>Duration: {formatDuration(job.metrics.duration)}</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className={styles.noHistory}>No job history available</div>
        )}
      </div>
    </div>
  );
}

export default BatchJobs;