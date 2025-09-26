// src/variables/charts.js
export const chartOptions = () => {
  return {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: true,
        position: 'top',
      }
    }
  };
};

export const parseOptions = (Chart, options) => {
  // Implémentation simplifiée pour éviter l'erreur
  try {
    Chart.defaults.plugins.legend.display = options.plugins.legend.display;
    Chart.defaults.plugins.legend.position = options.plugins.legend.position;
  } catch (error) {
    console.warn('Chart options configuration skipped:', error);
  }
};