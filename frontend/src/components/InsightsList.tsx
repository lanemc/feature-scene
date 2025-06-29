import { Link } from 'react-router-dom';
import { AlertCircle, TrendingUp, Users } from 'lucide-react';
import styles from './InsightsList.module.css';

interface Insight {
  id: string;
  title: string;
  summary: string;
  priority: 'high' | 'medium' | 'low';
  category: string;
  status: string;
  metrics?: {
    affectedUsers?: number;
  };
}

interface InsightsListProps {
  insights: Insight[];
  onSelect?: (insightId: string) => void;
}

function InsightsList({ insights, onSelect }: InsightsListProps) {
  const getPriorityIcon = (priority: string) => {
    switch (priority) {
      case 'high':
        return <AlertCircle size={16} />;
      case 'medium':
        return <TrendingUp size={16} />;
      default:
        return <Users size={16} />;
    }
  };

  if (insights.length === 0) {
    return (
      <div className={styles.empty}>
        No insights available. Run a batch job to generate insights.
      </div>
    );
  }

  return (
    <div className={styles.list}>
      {insights.map((insight) => {
        const ItemWrapper = onSelect ? 'div' : Link;
        const itemProps = onSelect 
          ? { onClick: () => onSelect(insight.id), className: styles.insightItem }
          : { to: `/insights?id=${insight.id}`, className: styles.insightItem };
        
        return (
          <ItemWrapper
            key={insight.id}
            {...itemProps}
          >
          <div className={styles.header}>
            <div className={`${styles.priority} ${styles[insight.priority]}`}>
              {getPriorityIcon(insight.priority)}
              <span>{insight.priority}</span>
            </div>
            <span className={styles.category}>{insight.category}</span>
          </div>
          
          <h4 className={styles.title}>{insight.title}</h4>
          <p className={styles.summary}>{insight.summary}</p>
          
          {insight.metrics?.affectedUsers && (
            <div className={styles.metrics}>
              <Users size={14} />
              <span>{insight.metrics.affectedUsers} users affected</span>
            </div>
          )}
        </ItemWrapper>
        );
      })}
    </div>
  );
}

export default InsightsList;