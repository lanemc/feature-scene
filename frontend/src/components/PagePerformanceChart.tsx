import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import { Bar } from 'react-chartjs-2';
import styles from './PagePerformanceChart.module.css';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

interface PageData {
  page: string;
  title?: string;
  avgTime: number;
}

interface PagePerformanceChartProps {
  data: PageData[];
}

function PagePerformanceChart({ data }: PagePerformanceChartProps) {
  if (!data || data.length === 0) {
    return <div className={styles.noData}>No performance data available</div>;
  }

  // Sort by average time and take top 10
  const sortedData = [...data]
    .sort((a, b) => b.avgTime - a.avgTime)
    .slice(0, 10);

  const chartData = {
    labels: sortedData.map(item => item.title || item.page.split('/').pop() || 'Page'),
    datasets: [
      {
        label: 'Average Time (ms)',
        data: sortedData.map(item => item.avgTime),
        backgroundColor: '#6366f1',
        borderColor: '#4f46e5',
        borderWidth: 1,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        callbacks: {
          label: (context: any) => {
            const time = context.parsed.y;
            return `Average time: ${(time / 1000).toFixed(2)}s`;
          },
        },
      },
    },
    scales: {
      x: {
        ticks: {
          maxRotation: 45,
          minRotation: 45,
        },
      },
      y: {
        beginAtZero: true,
        ticks: {
          callback: (value: any) => {
            return `${(value / 1000).toFixed(1)}s`;
          },
        },
      },
    },
  };

  return (
    <div className={styles.chartContainer}>
      <Bar data={chartData} options={options} />
    </div>
  );
}

export default PagePerformanceChart;