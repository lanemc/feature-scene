import { TrendingUp, TrendingDown } from 'lucide-react';
import styles from './StatsCard.module.css';

interface StatsCardProps {
  title: string;
  value: number | string;
  trend?: number;
  type?: 'success' | 'error' | 'warning' | 'info' | 'neutral';
}

function StatsCard({ title, value, trend = 0, type = 'neutral' }: StatsCardProps) {
  return (
    <div className={`${styles.card} ${styles[type]}`}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.value}>{value}</div>
      {trend !== 0 && (
        <div className={styles.trend}>
          {trend > 0 ? (
            <>
              <TrendingUp size={16} />
              <span>+{trend}%</span>
            </>
          ) : (
            <>
              <TrendingDown size={16} />
              <span>{trend}%</span>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export default StatsCard;