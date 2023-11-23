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
    plugins: {
      legend: {
        display: false, // Hide the legend if you don't need it
      },
    },
    scales: {
      x: {
        grid: {
          display: false, // Hide grid lines for x-axis
          drawBorder: false, // Remove the axis border
        },
        ticks: {
          display: true, // If you want to show x-axis labels
        },
      },
      y: {
        beginAtZero: true,
        grid: {
          display: false, // Hide grid lines for y-axis
          drawBorder: false, // Remove the axis border
        },
        ticks: {
          display: true, // Hide y-axis labels
        },
      },
    },
    maintainAspectRatio: false,
    elements: {
      point:{
        radius: 0 // Hide the points on the line
      },
      line: {
        borderWidth: 2, // Set the line thickness
      },
    },
  };
  
  const BalanceChart = () => {
    return (
      <div style={{ position: "relative", height: "40vh" }}>
        <Line data={mockChartData} options={options} />
      </div>
    );
  };
  
  export default BalanceChart;


  