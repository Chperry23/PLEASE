import React from 'react';
import Gauge from 'react-gauge-chart';

const GaugeChart = ({ value, label }) => (
  <div>
    <Gauge
      percent={value / 100}
      needleColor="#345243"
      needleBaseColor="#345243"
      colors={["#5BE12C", "#F5CD19", "#EA4228"]}
    />
    <p className="text-center mt-2">{label}: {value}%</p>
  </div>
);

export default GaugeChart;
