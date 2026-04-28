/**
 * Graph Renderer Module
 * Renders charts using Chart.js for statistical results
 */

export class GraphRenderer {
    constructor() {
        this.defaultColors = [
            '#0891b2', '#f59e0b', '#10b981', '#ef4444', 
            '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'
        ];
    }
    
    // ============ T-TEST CHART ============
    
    renderTTestChart(ctx, results) {
        const labels = [results.variables.var1, results.variables.var2];
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Mean',
                    data: [results.var1Stats.mean, results.var2Stats.mean],
                    backgroundColor: this.defaultColors[0],
                    borderColor: this.defaultColors[0],
                    borderWidth: 2
                }, {
                    label: 'Mean ± SE',
                    data: [
                        [results.var1Stats.mean - results.var1Stats.stdError, 
                         results.var1Stats.mean + results.var1Stats.stdError],
                        [results.var2Stats.mean - results.var2Stats.stdError, 
                         results.var2Stats.mean + results.var2Stats.stdError]
                    ],
                    backgroundColor: this.defaultColors.map(c => c + '33'),
                    borderColor: this.defaultColors[1],
                    borderWidth: 1,
                    // Custom plugin for error bars
                    type: 'bar'
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: `T-Test: ${results.variables.var1} vs ${results.variables.var2}`,
                        font: { size: 16, weight: 'bold' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                const label = context.dataset.label || '';
                                const value = context.parsed.y;
                                return `${label}: ${value.toFixed(4)}`;
                            }
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: 'Value'
                        }
                    }
                }
            }
        });
    }
    
    // ============ ANOVA CHART ============
    
    renderAnovaChart(ctx, results) {
        const labels = results.groupStats.map(g => String(g.group));
        const means = results.groupStats.map(g => g.mean);
        const errors = results.groupStats.map(g => g.stdError);
        
        // Create error bars data
        const upperBounds = means.map((m, i) => m + errors[i]);
        const lowerBounds = means.map((m, i) => m - errors[i]);
        
        return new Chart(ctx, {
            type: 'bar',
            data: {
                labels,
                datasets: [{
                    label: 'Group Means',
                    data: means,
                    backgroundColor: this.defaultColors,
                    borderColor: this.defaultColors.map(c => c),
                    borderWidth: 2,
                    barPercentage: 0.6
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: `ANOVA: ${results.variables.dependent} by ${results.variables.factor1}`,
                        font: { size: 16, weight: 'bold' }
                    },
                    subtitle: {
                        display: true,
                        text: `F(${results.dfBetween}, ${results.dfWithin}) = ${results.fValue.toFixed(4)}, p = ${results.pValue.toFixed(6)}`,
                        font: { size: 12, style: 'italic' }
                    },
                    legend: {
                        display: false
                    },
                    tooltip: {
                        callbacks: {
                            afterLabel: (context) => {
                                const idx = context.dataIndex;
                                const stat = results.groupStats[idx];
                                return [
                                    `N: ${stat.n}`,
                                    `SD: ${stat.stdDev.toFixed(4)}`,
                                    `SE: ${stat.stdError.toFixed(4)}`,
                                    `95% CI: [${stat.ciLower.toFixed(2)}, ${stat.ciUpper.toFixed(2)}]`
                                ];
                            }
                        }
                    },
                    annotation: {
                        annotations: {}
                    }
                },
                scales: {
                    y: {
                        beginAtZero: false,
                        title: {
                            display: true,
                            text: results.variables.dependent
                        }
                    },
                    x: {
                        title: {
                            display: true,
                            text: results.variables.factor1
                        }
                    }
                }
            }
        });
    }
    
    // ============ CORRELATION CHART ============
    
    renderCorrelationChart(ctx, results) {
        const { x, y, yPred } = results.rawData || { x: [], y: [], yPred: [] };
        
        // Scatter plot with regression line
        const scatterData = x.map((xi, i) => ({ x: xi, y: y[i] }));
        const lineData = x.map((xi, i) => ({ x: xi, y: yPred[i] }));
        
        // Sort line data by x
        lineData.sort((a, b) => a.x - b.x);
        
        return new Chart(ctx, {
            type: 'scatter',
            data: {
                datasets: [{
                    label: 'Data Points',
                    data: scatterData,
                    backgroundColor: this.defaultColors[0] + '99',
                    borderColor: this.defaultColors[0],
                    pointRadius: 6,
                    pointHoverRadius: 8
                }, {
                    label: 'Regression Line',
                    data: lineData,
                    type: 'line',
                    borderColor: this.defaultColors[1],
                    borderWidth: 2,
                    pointRadius: 0,
                    fill: false,
                    tension: 0
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${results.method.charAt(0).toUpperCase() + results.method.slice(1)} Correlation`,
                        font: { size: 16, weight: 'bold' }
                    },
                    subtitle: {
                        display: true,
                        text: `r = ${results.coefficient.toFixed(4)}, R² = ${results.rSquared.toFixed(4)}, p = ${results.pValue.toFixed(6)}`,
                        font: { size: 12, style: 'italic' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `(${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: results.variables?.var1 || 'X Variable'
                        },
                        grid: {
                            display: true,
                            color: '#e2e8f0'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: results.variables?.var2 || 'Y Variable'
                        },
                        grid: {
                            display: true,
                            color: '#e2e8f0'
                        }
                    }
                }
            }
        });
    }
    
    // ============ REGRESSION CHART ============
    
    renderRegressionChart(ctx, results) {
        const { x, y, yPred } = results.rawData || { x: [], y: [], yPred: [] };
        
        // Sort data by x for line
        const sortedIndices = x.map((_, i) => i).sort((a, b) => x[a] - x[b]);
        const sortedX = sortedIndices.map(i => x[i]);
        const sortedPred = sortedIndices.map(i => yPred[i]);
        
        // Scatter data
        const scatterData = x.map((xi, i) => ({ x: xi, y: y[i] }));
        const lineData = sortedX.map((xi, i) => ({ x: xi, y: sortedPred[i] }));
        
        // Prediction interval data if available
        let ciUpperData = null, ciLowerData = null;
        let piUpperData = null, piLowerData = null;
        
        if (results.predictions) {
            const sortedPredictions = [...results.predictions].sort((a, b) => a.x - b.x);
            
            if (sortedPredictions[0].ciUpper) {
                ciUpperData = sortedPredictions.map(p => ({ x: p.x, y: p.ciUpper }));
                ciLowerData = sortedPredictions.map(p => ({ x: p.x, y: p.ciLower }));
            }
            
            if (sortedPredictions[0].piUpper) {
                piUpperData = sortedPredictions.map(p => ({ x: p.x, y: p.piUpper }));
                piLowerData = sortedPredictions.map(p => ({ x: p.x, y: p.piLower }));
            }
        }
        
        // Build datasets
        const datasets = [{
            label: 'Data Points',
            data: scatterData,
            backgroundColor: this.defaultColors[0] + '99',
            borderColor: this.defaultColors[0],
            pointRadius: 6,
            pointHoverRadius: 8
        }, {
            label: 'Regression Line',
            data: lineData,
            type: 'line',
            borderColor: this.defaultColors[1],
            borderWidth: 3,
            pointRadius: 0,
            fill: false,
            tension: 0
        }];
        
        // Add confidence interval if available
        if (ciUpperData) {
            datasets.push({
                label: '95% CI',
                data: ciUpperData,
                type: 'line',
                borderColor: this.defaultColors[2] + '66',
                borderWidth: 1,
                pointRadius: 0,
                fill: false,
                tension: 0.1
            });
            datasets.push({
                label: '95% CI Lower',
                data: ciLowerData,
                type: 'line',
                borderColor: this.defaultColors[2] + '66',
                borderWidth: 1,
                pointRadius: 0,
                tension: 0.1
            });
        }
        
        // Add prediction interval if available
        if (piUpperData) {
            datasets.push({
                label: '95% PI',
                data: piUpperData,
                type: 'line',
                borderColor: this.defaultColors[3] + '44',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                tension: 0.1
            });
            datasets.push({
                label: '95% PI Lower',
                data: piLowerData,
                type: 'line',
                borderColor: this.defaultColors[3] + '44',
                borderWidth: 1,
                borderDash: [5, 5],
                pointRadius: 0,
                tension: 0.1
            });
        }
        
        return new Chart(ctx, {
            type: 'scatter',
            data: { datasets },
            options: {
                responsive: true,
                maintainAspectRatio: true,
                plugins: {
                    title: {
                        display: true,
                        text: `${results.subtype.charAt(0).toUpperCase() + results.subtype.slice(1)} Regression`,
                        font: { size: 16, weight: 'bold' }
                    },
                    subtitle: {
                        display: true,
                        text: `R = ${results.r.toFixed(4)}, R² = ${results.rSquared.toFixed(4)}, ${results.equation}`,
                        font: { size: 11, style: 'italic' }
                    },
                    legend: {
                        display: true,
                        position: 'top'
                    },
                    tooltip: {
                        callbacks: {
                            label: (context) => {
                                return `(${context.parsed.x.toFixed(2)}, ${context.parsed.y.toFixed(2)})`;
                            }
                        }
                    }
                },
                scales: {
                    x: {
                        title: {
                            display: true,
                            text: results.variables?.x || 'X Variable'
                        },
                        grid: {
                            display: true,
                            color: '#e2e8f0'
                        }
                    },
                    y: {
                        title: {
                            display: true,
                            text: results.variables?.y || 'Y Variable'
                        },
                        grid: {
                            display: true,
                            color: '#e2e8f0'
                        }
                    }
                }
            }
        });
    }
    
    // ============ UTILITY METHODS ============
    
    generateColorPalette(count) {
        const colors = [];
        for (let i = 0; i < count; i++) {
            const hue = (i * 360) / count;
            colors.push(`hsl(${hue}, 70%, 50%)`);
        }
        return colors;
    }
    
    destroyChart(chart) {
        if (chart) {
            chart.destroy();
        }
    }
}
 
