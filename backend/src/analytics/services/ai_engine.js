'use strict';

const { detectSignals }           = require('./signals');
const { forecast }                = require('./forecasting');
const { generateRecommendations } = require('./recommendations');
const { analyzeRootCauses }       = require('./rootcause');

async function runAnalysis(data) {
  const { entries, topModels, topReasons, categories } = data;

  const signals        = detectSignals(entries, topModels);
  const forecastData   = forecast(entries, 7);
  const recommendations = generateRecommendations(topModels, topReasons, signals, forecastData, categories);
  const rootCauses     = analyzeRootCauses(entries);

  return {
    signals,
    forecast:        forecastData,
    recommendations,
    rootCauses,
    summary: {
      totalEntries:    entries.length,
      totalDefects:    entries.reduce((s, e) => s + parseInt(e.qty || 1), 0),
      uniqueModels:    [...new Set(entries.map(e => e.sku || e.model))].length,
      uniqueReasons:   [...new Set(entries.map(e => e.reason))].length,
      signalCount:     signals.length,
      criticalSignals: signals.filter(s => s.severity === 'critical' || s.severity === 'high').length,
    },
  };
}

module.exports = { runAnalysis };
