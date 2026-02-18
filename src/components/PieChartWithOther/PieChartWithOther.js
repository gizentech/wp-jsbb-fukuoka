import { Pie } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import styles from './PieChartWithOther.module.css';

ChartJS.register(ArcElement, Tooltip, Legend);

export default function PieChartWithOther({ title, data, otherResponses = [] }) {
  // データが空の場合
  if (!data || Object.keys(data).length === 0) {
    return (
      <div className={styles.container}>
        <h3 className={styles.title}>{title}</h3>
        <p className={styles.noData}>データがありません</p>
      </div>
    );
  }

  // 総数を計算
  const total = Object.values(data).reduce((sum, count) => sum + count, 0);

  // データとラベルを準備
  const labels = Object.keys(data);
  const values = Object.values(data);

  // パーセンテージを計算
  const percentages = values.map(value => ((value / total) * 100).toFixed(1));

  // カラーパレット（紺色→青→水色→グレーのグラデーション）
  const colors = [
    '#1a237e', // 紺色
    '#3949ab', // 薄い紺
    '#2196F3', // 青
    '#00ACC1', // 濃い水色
    '#4DD0E1', // 薄い水色
    '#9E9E9E', // グレー
    '#BDBDBD', // 薄いグレー
    '#E0E0E0'  // 薄いグレー2
  ];

  const chartData = {
    labels: labels,
    datasets: [
      {
        data: values,
        backgroundColor: colors.slice(0, labels.length),
        borderColor: '#fff',
        borderWidth: 2,
      },
    ],
  };

  const options = {
    responsive: true,
    maintainAspectRatio: true,
    plugins: {
      legend: {
        position: 'bottom',
        labels: {
          font: {
            size: 12,
          },
          padding: 15,
          generateLabels: (chart) => {
            const data = chart.data;
            if (data.labels.length && data.datasets.length) {
              return data.labels.map((label, i) => {
                const value = data.datasets[0].data[i];
                const percentage = ((value / total) * 100).toFixed(1);
                return {
                  text: `${label}: ${percentage}% (${value}件)`,
                  fillStyle: data.datasets[0].backgroundColor[i],
                  hidden: false,
                  index: i,
                };
              });
            }
            return [];
          },
        },
      },
      tooltip: {
        callbacks: {
          label: function (context) {
            const label = context.label || '';
            const value = context.parsed;
            const percentage = ((value / total) * 100).toFixed(1);
            return `${label}: ${percentage}% (${value}件)`;
          },
        },
      },
    },
  };

  return (
    <div className={styles.container}>
      <h3 className={styles.title}>{title}</h3>
      <div className={styles.content}>
        <div className={styles.chartContainer}>
          <Pie data={chartData} options={options} />
        </div>
        {otherResponses && otherResponses.length > 0 && (
          <div className={styles.otherContainer}>
            <h4 className={styles.otherTitle}>その他の回答</h4>
            <div className={styles.otherList}>
              {otherResponses.map((response, index) => (
                <div key={index} className={styles.otherItem}>
                  {response}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
