import { useMemo } from 'react';
import {
    ScatterChart, Scatter, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
    LineChart, Line, Legend, ReferenceLine
} from 'recharts';
import { TrendingUp, Move, Target, Zap, AlertTriangle, CheckCircle, Activity } from 'lucide-react';
import { calculateAllMetrics, compareRomberg, calculateFallRisk } from '../utils/analysisEngine';
import './ResultsDashboard.css';

export default function ResultsDashboard({ filesData, clinicalData }) {
    const analysis = useMemo(() => {
        if (!filesData) return null;

        const metricsOA = filesData.OA ? calculateAllMetrics(filesData.OA.data) : null;
        const metricsOC = filesData.OC ? calculateAllMetrics(filesData.OC.data) : null;
        const romberg = (metricsOA && metricsOC) ? compareRomberg(metricsOA, metricsOC) : null;
        const fallRisk = calculateFallRisk(metricsOA, metricsOC, clinicalData);

        return { metricsOA, metricsOC, romberg, fallRisk };
    }, [filesData, clinicalData]);

    if (!analysis || (!analysis.metricsOA && !analysis.metricsOC)) {
        return (
            <div className="dashboard-empty">
                <Activity size={48} strokeWidth={1.5} />
                <h3>Sin datos para analizar</h3>
                <p>Cargue al menos un archivo de posturografía para ver los resultados</p>
            </div>
        );
    }

    const { metricsOA, metricsOC, romberg, fallRisk } = analysis;

    // Formatear datos para gráficos
    const getScatterData = (data, condition) => {
        if (!data) return [];
        return filesData[condition]?.data.map((p, i) => ({
            x: p.x,
            y: p.y,
            index: i
        })) || [];
    };

    const getTimeSeriesData = (data, condition) => {
        if (!data) return [];
        const rawData = filesData[condition]?.data || [];
        const startTime = rawData[0]?.timestamp || 0;
        return rawData.map((p) => ({
            time: (p.timestamp - startTime) / 1000,
            x: p.x,
            y: p.y
        }));
    };

    const MetricCard = ({ icon: Icon, label, value, unit, severity = 'normal' }) => (
        <div className={`metric-card ${severity}`}>
            <div className="metric-icon">
                <Icon size={20} />
            </div>
            <div className="metric-content">
                <span className="metric-value">
                    {typeof value === 'number' ? value.toFixed(2) : value}
                    <small>{unit}</small>
                </span>
                <span className="metric-label">{label}</span>
            </div>
        </div>
    );

    const RiskIndicator = ({ risk }) => (
        <div className="risk-indicator" style={{ '--risk-color': risk.color }}>
            <div className="risk-header">
                <div className="risk-level">
                    <span className="risk-badge" style={{ background: risk.color }}>
                        {risk.level}
                    </span>
                    <span className="risk-score">{risk.score} / {risk.maxScore} pts</span>
                </div>
                <div className="risk-bar-container">
                    <div
                        className="risk-bar"
                        style={{
                            width: `${(risk.score / risk.maxScore) * 100}%`,
                            background: risk.color
                        }}
                    />
                </div>
            </div>
            <p className="risk-interpretation">{risk.interpretation}</p>

            {risk.factors.length > 0 && (
                <div className="risk-factors">
                    <h4>Factores de riesgo identificados:</h4>
                    <ul>
                        {risk.factors.slice(0, 5).map((factor, i) => (
                            <li key={i} className={`factor-${factor.severity}`}>
                                <span className="factor-name">{factor.name}</span>
                                <span className="factor-contribution">+{factor.contribution} pts</span>
                            </li>
                        ))}
                    </ul>
                </div>
            )}
        </div>
    );

    return (
        <div className="results-dashboard">
            {/* Indicador de Riesgo Principal */}
            <section className="dashboard-section risk-section">
                <h2>
                    <AlertTriangle size={20} />
                    Evaluación de Riesgo de Caídas
                </h2>
                <RiskIndicator risk={fallRisk} />
            </section>

            {/* Métricas Principales */}
            <section className="dashboard-section">
                <h2>
                    <TrendingUp size={20} />
                    Métricas de Estabilidad
                </h2>

                <div className="metrics-comparison">
                    {metricsOA && (
                        <div className="metrics-column">
                            <h3>👁️ Ojos Abiertos (OA)</h3>
                            <div className="metrics-grid">
                                <MetricCard icon={Move} label="Longitud del recorrido" value={metricsOA.pathLength} unit="cm" />
                                <MetricCard icon={Zap} label="Velocidad media" value={metricsOA.meanVelocity} unit="cm/s"
                                    severity={metricsOA.meanVelocity > 2.5 ? 'high' : metricsOA.meanVelocity > 1.5 ? 'medium' : 'normal'} />
                                <MetricCard icon={Target} label="Área de elipse 95%" value={metricsOA.ellipseArea} unit="cm²"
                                    severity={metricsOA.ellipseArea > 6 ? 'high' : metricsOA.ellipseArea > 4 ? 'medium' : 'normal'} />
                                <MetricCard icon={Activity} label="Entropía" value={metricsOA.entropyMean} unit="" />
                            </div>
                        </div>
                    )}

                    {metricsOC && (
                        <div className="metrics-column">
                            <h3>🔒 Ojos Cerrados (OC)</h3>
                            <div className="metrics-grid">
                                <MetricCard icon={Move} label="Longitud del recorrido" value={metricsOC.pathLength} unit="cm" />
                                <MetricCard icon={Zap} label="Velocidad media" value={metricsOC.meanVelocity} unit="cm/s"
                                    severity={metricsOC.meanVelocity > 2.5 ? 'high' : metricsOC.meanVelocity > 1.5 ? 'medium' : 'normal'} />
                                <MetricCard icon={Target} label="Área de elipse 95%" value={metricsOC.ellipseArea} unit="cm²"
                                    severity={metricsOC.ellipseArea > 6 ? 'high' : metricsOC.ellipseArea > 4 ? 'medium' : 'normal'} />
                                <MetricCard icon={Activity} label="Entropía" value={metricsOC.entropyMean} unit="" />
                            </div>
                        </div>
                    )}
                </div>

                {/* Índices de Romberg */}
                {romberg && (
                    <div className="romberg-section">
                        <h3>📊 Análisis de Romberg (Variación OC vs OA)</h3>
                        <div className="romberg-grid">
                            <div className={`romberg-item ${romberg.rombergVelocity > 100 ? 'warning' : ''}`}>
                                <span className="romberg-value">{romberg.rombergVelocity.toFixed(0)}%</span>
                                <span className="romberg-label">Velocidad</span>
                            </div>
                            <div className={`romberg-item ${romberg.rombergArea > 100 ? 'warning' : ''}`}>
                                <span className="romberg-value">{romberg.rombergArea.toFixed(0)}%</span>
                                <span className="romberg-label">Área</span>
                            </div>
                            <div className={`romberg-item ${romberg.rombergPathLength > 100 ? 'warning' : ''}`}>
                                <span className="romberg-value">{romberg.rombergPathLength.toFixed(0)}%</span>
                                <span className="romberg-label">Longitud</span>
                            </div>
                            <div className={`romberg-item ${romberg.entropyChange < -0.1 ? 'warning' : ''}`}>
                                <span className="romberg-value">{romberg.entropyChange > 0 ? '+' : ''}{romberg.entropyChange.toFixed(2)}</span>
                                <span className="romberg-label">Δ Entropía</span>
                            </div>
                        </div>
                        <p className="romberg-interpretation">
                            {romberg.rombergVelocity > 150
                                ? '⚠️ Alta dependencia del sistema visual para mantener el equilibrio.'
                                : romberg.rombergVelocity > 100
                                    ? 'Dependencia visual moderada. El sistema vestibular-propioceptivo muestra cierta limitación.'
                                    : '✓ Buena compensación vestibular-propioceptiva ante la eliminación del input visual.'}
                        </p>
                    </div>
                )}
            </section>

            {/* Gráficos - Estatocinesigrama (X-Y) */}
            <section className="dashboard-section charts-section">
                <h2>
                    <Target size={20} />
                    Estatocinesigrama (Trayectoria del COP)
                </h2>
                <div className="charts-row">
                    {metricsOA && (
                        <div className="chart-container">
                            <h4>Ojos Abiertos</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        name="X"
                                        unit=" cm"
                                        domain={['auto', 'auto']}
                                        stroke="#64748b"
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        name="Y"
                                        unit=" cm"
                                        domain={['auto', 'auto']}
                                        stroke="#64748b"
                                    />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                    />
                                    <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
                                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                                    <Scatter
                                        name="COP"
                                        data={getScatterData(metricsOA, 'OA')}
                                        fill="#3b82f6"
                                        fillOpacity={0.6}
                                        r={2}
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {metricsOC && (
                        <div className="chart-container">
                            <h4>Ojos Cerrados</h4>
                            <ResponsiveContainer width="100%" height={300}>
                                <ScatterChart margin={{ top: 20, right: 20, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis
                                        type="number"
                                        dataKey="x"
                                        name="X"
                                        unit=" cm"
                                        domain={['auto', 'auto']}
                                        stroke="#64748b"
                                    />
                                    <YAxis
                                        type="number"
                                        dataKey="y"
                                        name="Y"
                                        unit=" cm"
                                        domain={['auto', 'auto']}
                                        stroke="#64748b"
                                    />
                                    <Tooltip
                                        cursor={{ strokeDasharray: '3 3' }}
                                        contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }}
                                    />
                                    <ReferenceLine x={0} stroke="#94a3b8" strokeDasharray="3 3" />
                                    <ReferenceLine y={0} stroke="#94a3b8" strokeDasharray="3 3" />
                                    <Scatter
                                        name="COP"
                                        data={getScatterData(metricsOC, 'OC')}
                                        fill="#f59e0b"
                                        fillOpacity={0.6}
                                        r={2}
                                    />
                                </ScatterChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </section>

            {/* Gráficos - Estabilograma (Temporal) */}
            <section className="dashboard-section charts-section">
                <h2>
                    <Activity size={20} />
                    Estabilograma (Evolución Temporal)
                </h2>
                <div className="charts-row">
                    {metricsOA && (
                        <div className="chart-container">
                            <h4>Ojos Abiertos - Desplazamiento X/Y en el tiempo</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={getTimeSeriesData(metricsOA, 'OA')} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="time" unit="s" stroke="#64748b" />
                                    <YAxis unit=" cm" stroke="#64748b" />
                                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="x" stroke="#3b82f6" dot={false} strokeWidth={1.5} name="X (ML)" />
                                    <Line type="monotone" dataKey="y" stroke="#10b981" dot={false} strokeWidth={1.5} name="Y (AP)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}

                    {metricsOC && (
                        <div className="chart-container">
                            <h4>Ojos Cerrados - Desplazamiento X/Y en el tiempo</h4>
                            <ResponsiveContainer width="100%" height={250}>
                                <LineChart data={getTimeSeriesData(metricsOC, 'OC')} margin={{ top: 20, right: 30, bottom: 20, left: 20 }}>
                                    <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                                    <XAxis dataKey="time" unit="s" stroke="#64748b" />
                                    <YAxis unit=" cm" stroke="#64748b" />
                                    <Tooltip contentStyle={{ background: '#fff', border: '1px solid #e2e8f0', borderRadius: '8px' }} />
                                    <Legend />
                                    <Line type="monotone" dataKey="x" stroke="#f59e0b" dot={false} strokeWidth={1.5} name="X (ML)" />
                                    <Line type="monotone" dataKey="y" stroke="#ef4444" dot={false} strokeWidth={1.5} name="Y (AP)" />
                                </LineChart>
                            </ResponsiveContainer>
                        </div>
                    )}
                </div>
            </section>
        </div>
    );
}
