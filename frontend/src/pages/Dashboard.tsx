import { useQuery } from '@tanstack/react-query';
import { analyticsAPI, insightsAPI, batchAPI } from '../services/api';
import StatsCard from '../components/StatsCard';
import InsightsList from '../components/InsightsList';
import PainPointsChart from '../components/PainPointsChart';
import styles from './Dashboard.module.css';

function Dashboard() {
  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics', 'summary'],
    queryFn: () => analyticsAPI.getSummary(),
  });

  const { data: insights, isLoading: insightsLoading } = useQuery({
    queryKey: ['insights', { status: 'new' }],
    queryFn: () => insightsAPI.getAll({ status: 'new' }),
  });

  const { data: batchStatus } = useQuery({
    queryKey: ['batch', 'status'],
    queryFn: () => batchAPI.getStatus(),
    refetchInterval: 5000, // Poll every 5 seconds
  });

  if (summaryLoading || insightsLoading) {
    return <div className={styles.loading}>Loading dashboard...</div>;
  }

  return (
    <div className={styles.dashboard}>
      <div className={styles.header}>
        <h1>Dashboard</h1>
        <div className={styles.batchStatus}>
          {batchStatus?.status === 'running' ? (
            <span className={styles.running}>Batch job running...</span>
          ) : (
            <span className={styles.idle}>Last update: {new Date().toLocaleString()}</span>
          )}
        </div>
      </div>

      <div className={styles.statsGrid}>
        <StatsCard
          title="Total Pain Points"
          value={summary?.painPoints?.dropoffs + summary?.painPoints?.cycles + summary?.painPoints?.underused || 0}
          trend={0}
          type="neutral"
        />
        <StatsCard
          title="New Insights"
          value={insights?.total || 0}
          trend={0}
          type="warning"
        />
        <StatsCard
          title="Drop-off Points"
          value={summary?.painPoints?.dropoffs || 0}
          trend={0}
          type="error"
        />
        <StatsCard
          title="Underused Features"
          value={summary?.painPoints?.underused || 0}
          trend={0}
          type="info"
        />
      </div>

      <div className={styles.mainContent}>
        <div className={styles.chartSection}>
          <h2>Pain Points Overview</h2>
          <PainPointsChart data={summary} />
        </div>

        <div className={styles.insightsSection}>
          <h2>Recent Insights</h2>
          <InsightsList insights={insights?.insights?.slice(0, 5) || []} />
        </div>
      </div>

      {summary?.topDropoffs && summary.topDropoffs.length > 0 && (
        <div className={styles.dropoffsSection}>
          <h2>Top Drop-off Points</h2>
          <div className={styles.dropoffsList}>
            {summary.topDropoffs.map((dropoff: any, index: number) => (
              <div key={index} className={styles.dropoffItem}>
                <div className={styles.dropoffInfo}>
                  <h4>{dropoff.title || dropoff.page}</h4>
                  <p>{dropoff.page}</p>
                </div>
                <div className={styles.dropoffRate}>
                  {dropoff.dropoffRate?.toFixed(1)}%
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default Dashboard;