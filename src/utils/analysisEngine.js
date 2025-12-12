/**
 * Motor de análisis de posturografía
 * Parsea archivos Wii Balance Board y calcula métricas de estabilidad
 */

import {
    calculateCOP,
    calculatePathLength,
    calculateMeanVelocity,
    calculateConfidenceEllipseArea,
    calculateAmplitude,
    calculateSampleEntropy,
    calculateRombergIndex
} from './wbbMath.js';

/**
 * Detecta la condición experimental desde el nombre del archivo
 * @param {string} filename 
 * @returns {'OA' | 'OC' | 'UNKNOWN'}
 */
export function detectCondition(filename) {
    const lower = filename.toLowerCase();

    if (lower.includes('oc') || lower.includes('cerrados') || lower.includes('closed')) {
        return 'OC';
    }
    if (lower.includes('oa') || lower.includes('frente') || lower.includes('abiertos') || lower.includes('open')) {
        return 'OA';
    }

    return 'UNKNOWN';
}

/**
 * Valida y parsea el contenido del archivo de Wii Balance Board
 * @param {string} content - Contenido del archivo .txt o .csv
 * @param {string} filename - Nombre del archivo para detectar condición
 * @returns {Object} { success, data, error, condition, metadata }
 */
export function parseWBBFile(content, filename) {
    const lines = content.trim().split(/\r?\n/).filter(line => line.trim());

    if (lines.length < 10) {
        return {
            success: false,
            error: `El archivo contiene muy pocas líneas de datos (${lines.length} líneas, mínimo 10 requeridas)`,
            data: null
        };
    }

    const condition = detectCondition(filename);
    const copData = [];
    let parseErrors = 0;
    let debugInfo = [];

    // Detectar el separador más probable analizando la primera línea
    const firstLine = lines[0].trim();
    let separator = ',';

    if (firstLine.includes('\t')) {
        separator = '\t';
    } else if (firstLine.includes(';')) {
        separator = ';';
    } else if (firstLine.includes(',')) {
        separator = ',';
    } else if (firstLine.split(/\s+/).length >= 5) {
        separator = /\s+/; // Múltiples espacios
    }

    for (let i = 0; i < lines.length; i++) {
        let line = lines[i].trim();

        // Saltar líneas que parecen encabezados
        if (i === 0 && /[a-zA-Z]/.test(line) && !/\d/.test(line.split(separator)[0])) {
            continue;
        }

        // Dividir por el separador detectado
        const parts = typeof separator === 'string'
            ? line.split(separator).map(p => p.trim())
            : line.split(separator).filter(p => p.trim());

        if (parts.length < 5) {
            parseErrors++;
            if (debugInfo.length < 3) {
                debugInfo.push(`Línea ${i + 1}: ${parts.length} columnas encontradas (se esperan 5)`);
            }
            continue;
        }

        // Convertir números, soportando tanto punto como coma decimal
        const parseNumber = (str) => {
            if (!str) return NaN;
            // Reemplazar coma por punto para decimales
            return parseFloat(str.replace(',', '.'));
        };

        const timestamp = parseNumber(parts[0]);
        const TL = parseNumber(parts[1]);
        const TR = parseNumber(parts[2]);
        const BL = parseNumber(parts[3]);
        const BR = parseNumber(parts[4]);

        if ([timestamp, TL, TR, BL, BR].some(isNaN)) {
            parseErrors++;
            if (debugInfo.length < 3) {
                debugInfo.push(`Línea ${i + 1}: valores no numéricos - [${parts.slice(0, 5).join(', ')}]`);
            }
            continue;
        }

        const totalForce = TL + TR + BL + BR;
        if (totalForce <= 0) {
            parseErrors++;
            continue;
        }

        const cop = calculateCOP(TL, TR, BL, BR);
        copData.push({
            timestamp,
            x: cop.x,
            y: cop.y,
            totalForce: cop.totalForce
        });
    }

    if (copData.length < 10) {
        const debugStr = debugInfo.length > 0 ? `\nDetalles: ${debugInfo.join('; ')}` : '';
        const sampleLine = lines[0] ? `\nPrimera línea: "${lines[0].substring(0, 80)}..."` : '';
        return {
            success: false,
            error: `Solo se pudieron parsear ${copData.length} líneas válidas (mínimo 10 requeridas).${sampleLine}${debugStr}`,
            data: null
        };
    }

    // Validar duración mínima (5 segundos)
    const duration = (copData[copData.length - 1].timestamp - copData[0].timestamp) / 1000;
    if (duration < 5) {
        return {
            success: false,
            error: `Duración insuficiente: ${duration.toFixed(1)}s (mínimo 5s requeridos)`,
            data: null
        };
    }

    // Calcular frecuencia de muestreo
    const samplingRate = copData.length / duration;

    return {
        success: true,
        data: copData,
        condition,
        metadata: {
            totalSamples: copData.length,
            duration: duration,
            samplingRate: samplingRate,
            parseErrors,
            filename
        }
    };
}

/**
 * Calcula todas las métricas de estabilidad para una prueba
 * @param {Array} copData - Array de {x, y, timestamp}
 * @returns {Object} Objeto con todas las métricas calculadas
 */
export function calculateAllMetrics(copData) {
    if (!copData || copData.length < 10) {
        return null;
    }

    const duration = (copData[copData.length - 1].timestamp - copData[0].timestamp) / 1000;
    const pathLength = calculatePathLength(copData);
    const meanVelocity = calculateMeanVelocity(pathLength, duration);
    const ellipseArea = calculateConfidenceEllipseArea(copData);
    const amplitude = calculateAmplitude(copData);

    // Sample Entropy para X e Y por separado
    const xSeries = copData.map(p => p.x);
    const ySeries = copData.map(p => p.y);
    const entropyX = calculateSampleEntropy(xSeries);
    const entropyY = calculateSampleEntropy(ySeries);

    // Calcular desviación estándar
    const meanX = xSeries.reduce((a, b) => a + b, 0) / xSeries.length;
    const meanY = ySeries.reduce((a, b) => a + b, 0) / ySeries.length;
    const stdX = Math.sqrt(xSeries.reduce((sum, v) => sum + Math.pow(v - meanX, 2), 0) / xSeries.length);
    const stdY = Math.sqrt(ySeries.reduce((sum, v) => sum + Math.pow(v - meanY, 2), 0) / ySeries.length);

    // RMS (Root Mean Square)
    const rmsX = Math.sqrt(xSeries.reduce((sum, v) => sum + v * v, 0) / xSeries.length);
    const rmsY = Math.sqrt(ySeries.reduce((sum, v) => sum + v * v, 0) / ySeries.length);

    return {
        // Métricas de distancia
        pathLength: pathLength,

        // Métricas de velocidad
        meanVelocity: meanVelocity,

        // Métricas de área/dispersión
        ellipseArea: ellipseArea,
        rangeX: amplitude.rangeX,
        rangeY: amplitude.rangeY,

        // Métricas estadísticas
        meanX, meanY,
        stdX, stdY,
        rmsX, rmsY,

        // Entropía
        entropyX, entropyY,
        entropyMean: (entropyX + entropyY) / 2,

        // Metadata
        duration,
        sampleCount: copData.length
    };
}

/**
 * Compara métricas entre condición OA y OC (Test de Romberg)
 * @param {Object} metricsOA - Métricas con ojos abiertos
 * @param {Object} metricsOC - Métricas con ojos cerrados
 * @returns {Object} Índices de Romberg y análisis comparativo
 */
export function compareRomberg(metricsOA, metricsOC) {
    if (!metricsOA || !metricsOC) return null;

    return {
        rombergPathLength: calculateRombergIndex(metricsOC.pathLength, metricsOA.pathLength),
        rombergVelocity: calculateRombergIndex(metricsOC.meanVelocity, metricsOA.meanVelocity),
        rombergArea: calculateRombergIndex(metricsOC.ellipseArea, metricsOA.ellipseArea),
        rombergRangeX: calculateRombergIndex(metricsOC.rangeX, metricsOA.rangeX),
        rombergRangeY: calculateRombergIndex(metricsOC.rangeY, metricsOA.rangeY),

        // Cambio en entropía (importante para evaluar adaptación)
        entropyChange: metricsOC.entropyMean - metricsOA.entropyMean,

        // Ratio simple para interpretación
        velocityRatio: metricsOC.meanVelocity / metricsOA.meanVelocity,
        areaRatio: metricsOC.ellipseArea / metricsOA.ellipseArea
    };
}

/**
 * Calcula el score de riesgo de caídas integrando métricas posturográficas y datos clínicos
 * @param {Object} metricsOA - Métricas ojos abiertos
 * @param {Object} metricsOC - Métricas ojos cerrados (opcional)
 * @param {Object} clinicalData - Datos clínicos del paciente
 * @returns {Object} { score, level, factors, interpretation }
 */
export function calculateFallRisk(metricsOA, metricsOC, clinicalData) {
    let score = 0;
    const factors = [];

    // ============================================
    // FACTORES POSTUROGRÁFICOS (máx 50 puntos)
    // ============================================

    // Velocidad del COP (umbral: >1.5 cm/s indica inestabilidad)
    if (metricsOA) {
        if (metricsOA.meanVelocity > 2.5) {
            score += 15;
            factors.push({ name: 'Velocidad COP elevada (OA)', severity: 'high', contribution: 15 });
        } else if (metricsOA.meanVelocity > 1.5) {
            score += 8;
            factors.push({ name: 'Velocidad COP moderada (OA)', severity: 'medium', contribution: 8 });
        }

        // Área de elipse (umbral: >400 mm² = 4 cm²)
        if (metricsOA.ellipseArea > 6) {
            score += 10;
            factors.push({ name: 'Área de oscilación grande (OA)', severity: 'high', contribution: 10 });
        } else if (metricsOA.ellipseArea > 4) {
            score += 5;
            factors.push({ name: 'Área de oscilación moderada (OA)', severity: 'medium', contribution: 5 });
        }

        // Entropía baja indica patrón muy rígido (compensación patológica)
        if (metricsOA.entropyMean < 0.3) {
            score += 5;
            factors.push({ name: 'Patrón postural rígido (baja entropía)', severity: 'medium', contribution: 5 });
        }
    }

    // Análisis de Romberg si hay datos OC
    if (metricsOA && metricsOC) {
        const romberg = compareRomberg(metricsOA, metricsOC);

        // Índice de Romberg de velocidad > 100% indica dependencia visual significativa
        if (romberg.rombergVelocity > 150) {
            score += 12;
            factors.push({ name: 'Alta dependencia visual (Romberg elevado)', severity: 'high', contribution: 12 });
        } else if (romberg.rombergVelocity > 100) {
            score += 6;
            factors.push({ name: 'Dependencia visual moderada', severity: 'medium', contribution: 6 });
        }

        // Caída significativa de entropía con ojos cerrados
        if (romberg.entropyChange < -0.2) {
            score += 8;
            factors.push({ name: 'Deterioro del control postural sin visión', severity: 'high', contribution: 8 });
        }
    }

    // ============================================
    // FACTORES CLÍNICOS (máx 50 puntos)
    // ============================================

    // Edad
    const age = clinicalData?.age || 0;
    if (age >= 80) {
        score += 10;
        factors.push({ name: 'Edad ≥80 años', severity: 'high', contribution: 10 });
    } else if (age >= 70) {
        score += 6;
        factors.push({ name: 'Edad 70-79 años', severity: 'medium', contribution: 6 });
    } else if (age >= 65) {
        score += 3;
        factors.push({ name: 'Edad 65-69 años', severity: 'low', contribution: 3 });
    }

    // Historial de caídas
    const fallHistory = clinicalData?.fallHistory || 0;
    if (fallHistory >= 2) {
        score += 15;
        factors.push({ name: '2+ caídas en último año', severity: 'high', contribution: 15 });
    } else if (fallHistory === 1) {
        score += 8;
        factors.push({ name: '1 caída en último año', severity: 'medium', contribution: 8 });
    }

    // Antecedente de fractura en MMII
    if (clinicalData?.hasLowerLimbFracture) {
        score += 8;
        factors.push({ name: 'Antecedente de fractura en MMII', severity: 'medium', contribution: 8 });
    }

    // Polifarmacia
    const medications = clinicalData?.medicationCount || 0;
    if (medications >= 5) {
        score += 10;
        factors.push({ name: 'Polifarmacia (≥5 medicamentos)', severity: 'high', contribution: 10 });
    } else if (medications >= 3) {
        score += 5;
        factors.push({ name: '3-4 medicamentos', severity: 'medium', contribution: 5 });
    }

    // Condiciones que afectan aferencias sensoriales o fuerza
    const conditions = clinicalData?.conditions || {};

    if (conditions.vestibular) {
        score += 8;
        factors.push({ name: 'Patología vestibular', severity: 'high', contribution: 8 });
    }
    if (conditions.visual) {
        score += 6;
        factors.push({ name: 'Déficit visual significativo', severity: 'medium', contribution: 6 });
    }
    if (conditions.proprioceptive || conditions.neuropathy) {
        score += 8;
        factors.push({ name: 'Alteración propioceptiva/neuropatía', severity: 'high', contribution: 8 });
    }
    if (conditions.muscleWeakness) {
        score += 8;
        factors.push({ name: 'Debilidad muscular en MMII', severity: 'high', contribution: 8 });
    }

    // ============================================
    // CLASIFICACIÓN DEL RIESGO
    // ============================================
    let level, color, interpretation;

    if (score >= 50) {
        level = 'ALTO';
        color = '#dc2626'; // Rojo
        interpretation = 'Riesgo alto de caídas. Se recomienda evaluación multidisciplinaria urgente, revisión de medicación, evaluación del entorno y programa de ejercicios supervisados para mejorar el equilibrio y fuerza.';
    } else if (score >= 30) {
        level = 'MODERADO';
        color = '#f59e0b'; // Naranja
        interpretation = 'Riesgo moderado de caídas. Se sugiere programa de ejercicios de equilibrio, revisión de factores de riesgo modificables y seguimiento periódico.';
    } else if (score >= 15) {
        level = 'BAJO-MODERADO';
        color = '#eab308'; // Amarillo
        interpretation = 'Riesgo bajo a moderado. Mantener actividad física regular y control de factores de riesgo. Seguimiento anual recomendado.';
    } else {
        level = 'BAJO';
        color = '#22c55e'; // Verde
        interpretation = 'Riesgo bajo de caídas. Mantener hábitos saludables y actividad física regular.';
    }

    return {
        score,
        maxScore: 100,
        level,
        color,
        factors: factors.sort((a, b) => b.contribution - a.contribution),
        interpretation
    };
}
