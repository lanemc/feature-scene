import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import { Doughnut } from 'react-chartjs-2';
import styles from './PainPointsChart.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

interface PainPointsChartProps {
  data: any;
}

function PainPointsChart({ data }: PainPointsChartProps) {
  if (!data?.painPoints) {
    return <div className={styles.noData}>No data available</div>;
  }

  const chartData = {
    labels: ['Drop-offs', 'Navigation Cycles', 'Underused Features'],
    datasets: [
      {
        data: [
          data.painPoints.dropoffs || 0,
          data.painPoints.cycles || 0,
          data.painPoints.underused || 0,
        ],
        backgroundColor: [
          '#ef4444',
          '#f59e0b',
          '#3b82f6',
        ],
        borderWidth: 0,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'bottom' as const,
        labels: {
          padding: 20,
          usePointStyle: true,
        },
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const label = context.label || '';
            const value = context.parsed || 0;
            const total = context.dataset.data.reduce((a: number, b: number) => a + b, 0);
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${value} (${percentage}%)`;
          },
        },
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <Doughnut data={chartData} options={options} />
    </div>
  );
}

export default PainPointsChart;