import { ChevronRight } from 'lucide-react';
import styles from './UserPathsVisualization.module.css';

interface Path {
  pages: string[];
  frequency: number;
}

interface UserPathsVisualizationProps {
  paths: Path[];
}

function UserPathsVisualization({ paths }: UserPathsVisualizationProps) {
  if (!paths || paths.length === 0) {
    return <div className={styles.noData}>No path data available</div>;
  }

  const maxFrequency = Math.max(...paths.map(p => p.frequency));

  return (
    <div className={styles.container}>
      {paths.map((path, index) => (
        <div key={index} className={styles.path}>
          <div className={styles.pathFlow}>
            {path.pages.map((page, pageIndex) => (
              <div key={pageIndex} className={styles.pathSegment}>
                <div className={styles.page}>
                  {page.split('/').pop() || 'Home'}
                </div>
                {pageIndex < path.pages.length - 1 && (
                  <ChevronRight className={styles.arrow} size={16} />
                )}
              </div>
            ))}
          </div>
          <div className={styles.frequency}>
            <div className={styles.frequencyBar}>
              <div 
                className={styles.frequencyFill}
                style={{ width: `${(path.frequency / maxFrequency) * 100}%` }}
              />
            </div>
            <span className={styles.frequencyText}>{path.frequency} users</span>
          </div>
        </div>
      ))}
    </div>
  );
}

export default UserPathsVisualization;