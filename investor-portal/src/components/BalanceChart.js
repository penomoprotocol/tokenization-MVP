import React from 'react';
import { Line } from 'react-chartjs-2';
import 'chart.js/auto';

// Mock data for the chart
const mockChartData = {
  labels: ['January', 'February', 'March', 'April', 'May', 'June'],
  datasets: [
    {
      label: 'USD Value',
      data: [1000, 2000, 1500, 2500, 3000, 3500],
      fill: false,
      borderColor: 'rgb(75, 192, 192)',
      tension: 0.1,
    },
  ]
};

const options = {
  scales: {
    y: {
      beginAtZero: true
    }
  },
  maintainAspectRatio: false
};

const BalanceChart = () => {
  return (
    <div style={{ position: "relative", height: "40vh" }}>
      <Line data={mockChartData} options={options} />
    </div>
  );
};

export default BalanceChart;
