import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { analyticsAPI } from '../services/api';
import UserPathsVisualization from '../components/UserPathsVisualization';
import PagePerformanceChart from '../components/PagePerformanceChart';
import styles from './Analytics.module.css';

function Analytics() {
  const [dateRange, setDateRange] = useState({
    start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0],
    end: new Date().toISOString().split('T')[0],
  });

  const { data: summary, isLoading: summaryLoading } = useQuery({
    queryKey: ['analytics', 'summary', dateRange],
    queryFn: () => analyticsAPI.getSummary(dateRange.start, dateRange.end),
  });

  const { data: paths } = useQuery({
    queryKey: ['analytics', 'paths'],
    queryFn: () => analyticsAPI.getPaths(),
  });

  const { data: performance } = useQuery({
    queryKey: ['analytics', 'performance'],
    queryFn: () => analyticsAPI.getPagePerformance(),
  });

  if (summaryLoading) {
    return <div className={styles.loading}>Loading analytics...</div>;
  }

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1>Analytics</h1>
        <div className={styles.dateRange}>
          <input
            type="date"
            value={dateRange.start}
            onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className={styles.dateInput}
          />
          <span>to</span>
          <input
            type="date"
            value={dateRange.end}
            onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className={styles.dateInput}
          />
        </div>
      </div>

      <div className={styles.grid}>
        <div className={styles.card}>
          <h2>Common User Paths</h2>
          <UserPathsVisualization paths={paths?.paths || []} />
        </div>

        <div className={styles.card}>
          <h2>Page Performance</h2>
          <PagePerformanceChart data={performance?.pages || []} />
        </div>

        <div className={styles.card}>
          <h2>Top Drop-off Points</h2>
          {summary?.topDropoffs && summary.topDropoffs.length > 0 ? (
            <div className={styles.dropoffList}>
              {summary.topDropoffs.map((dropoff: any, index: number) => (
                <div key={index} className={styles.dropoffItem}>
                  <div className={styles.dropoffInfo}>
                    <h4>{dropoff.title || dropoff.page}</h4>
                    <p className={styles.url}>{dropoff.page}</p>
                    <div className={styles.stats}>
                      <span>In: {dropoff.incoming}</span>
                      <span>Out: {dropoff.outgoing}</span>
                    </div>
                  </div>
                  <div className={styles.dropoffRate}>
                    <div className={styles.rateValue}>{dropoff.dropoffRate?.toFixed(1)}%</div>
                    <div className={styles.rateLabel}>drop-off</div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noData}>No drop-off data available</div>
          )}
        </div>

        <div className={styles.card}>
          <h2>Underused Features</h2>
          {summary?.underusedFeatures && summary.underusedFeatures.length > 0 ? (
            <div className={styles.featureList}>
              {summary.underusedFeatures.map((feature: any, index: number) => (
                <div key={index} className={styles.featureItem}>
                  <div className={styles.featureInfo}>
                    <h4>{feature.title || feature.page}</h4>
                    <p className={styles.url}>{feature.page}</p>
                  </div>
                  <div className={styles.usageStats}>
                    <div className={styles.usageBar}>
                      <div 
                        className={styles.usageFill} 
                        style={{ width: `${feature.usageRate}%` }}
                      />
                    </div>
                    <span className={styles.usageText}>
                      {feature.usageRate?.toFixed(1)}% usage
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className={styles.noData}>No underused features data available</div>
          )}
        </div>
      </div>
    </div>
  );
}

export default Analytics;