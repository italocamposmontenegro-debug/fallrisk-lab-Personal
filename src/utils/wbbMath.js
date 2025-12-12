/**
 * Constantes y fórmulas para Wii Balance Board
 * Basado en dimensiones estándar de la WBB
 */

// Dimensiones de la Wii Balance Board en centímetros
export const WBB_WIDTH = 43.3;  // cm (distancia entre sensores izquierda-derecha)
export const WBB_HEIGHT = 23.8; // cm (distancia entre sensores frente-atrás)

// Distancia desde el centro a los sensores
export const SENSOR_OFFSET_X = WBB_WIDTH / 2;  // 21.65 cm
export const SENSOR_OFFSET_Y = WBB_HEIGHT / 2; // 11.9 cm

/**
 * Calcula las coordenadas del Centro de Presión (COP) a partir de los datos de los 4 sensores
 * @param {number} TL - Top Left sensor (kgf o N)
 * @param {number} TR - Top Right sensor
 * @param {number} BL - Bottom Left sensor  
 * @param {number} BR - Bottom Right sensor
 * @returns {Object} { x: number, y: number, totalForce: number } - Coordenadas en cm desde el centro
 */
export function calculateCOP(TL, TR, BL, BR) {
    const totalForce = TL + TR + BL + BR;

    if (totalForce <= 0) {
        return { x: 0, y: 0, totalForce: 0 };
    }

    // Cálculo del COP en cm
    // X positivo = derecha, X negativo = izquierda
    // Y positivo = adelante (Top), Y negativo = atrás (Bottom)
    const copX = ((TR + BR) - (TL + BL)) / totalForce * SENSOR_OFFSET_X;
    const copY = ((TL + TR) - (BL + BR)) / totalForce * SENSOR_OFFSET_Y;

    return {
        x: copX,
        y: copY,
        totalForce
    };
}

/**
 * Calcula la distancia euclidiana entre dos puntos
 */
export function euclideanDistance(x1, y1, x2, y2) {
    return Math.sqrt(Math.pow(x2 - x1, 2) + Math.pow(y2 - y1, 2));
}

/**
 * Calcula la longitud total del recorrido del COP (Path Length)
 * @param {Array} copData - Array de objetos {x, y, timestamp}
 * @returns {number} Longitud total en cm
 */
export function calculatePathLength(copData) {
    if (copData.length < 2) return 0;

    let totalLength = 0;
    for (let i = 1; i < copData.length; i++) {
        totalLength += euclideanDistance(
            copData[i - 1].x, copData[i - 1].y,
            copData[i].x, copData[i].y
        );
    }
    return totalLength;
}

/**
 * Calcula la velocidad media del COP
 * @param {number} pathLength - Longitud del recorrido en cm
 * @param {number} duration - Duración en segundos
 * @returns {number} Velocidad en cm/s
 */
export function calculateMeanVelocity(pathLength, duration) {
    if (duration <= 0) return 0;
    return pathLength / duration;
}

/**
 * Calcula el área del elipse de confianza al 95%
 * @param {Array} copData - Array de objetos {x, y}
 * @returns {number} Área en cm²
 */
export function calculateConfidenceEllipseArea(copData) {
    if (copData.length < 3) return 0;

    // Calcular medias
    const meanX = copData.reduce((sum, p) => sum + p.x, 0) / copData.length;
    const meanY = copData.reduce((sum, p) => sum + p.y, 0) / copData.length;

    // Calcular varianzas y covarianza
    let varX = 0, varY = 0, covXY = 0;
    for (const point of copData) {
        const dx = point.x - meanX;
        const dy = point.y - meanY;
        varX += dx * dx;
        varY += dy * dy;
        covXY += dx * dy;
    }
    varX /= (copData.length - 1);
    varY /= (copData.length - 1);
    covXY /= (copData.length - 1);

    // Factor F para 95% de confianza con 2 grados de libertad ≈ 5.991
    const F = 5.991;

    // Área del elipse = π * a * b, donde a y b son los semiejes
    // Usando eigenvalues simplificados para elipse de confianza
    const trace = varX + varY;
    const det = varX * varY - covXY * covXY;
    const discriminant = Math.sqrt(Math.max(0, trace * trace / 4 - det));

    const lambda1 = trace / 2 + discriminant;
    const lambda2 = trace / 2 - discriminant;

    const a = Math.sqrt(F * Math.max(0, lambda1));
    const b = Math.sqrt(F * Math.max(0, lambda2));

    return Math.PI * a * b;
}

/**
 * Calcula la amplitud máxima en cada eje
 * @param {Array} copData - Array de objetos {x, y}
 * @returns {Object} { rangeX, rangeY, maxX, minX, maxY, minY }
 */
export function calculateAmplitude(copData) {
    if (copData.length === 0) {
        return { rangeX: 0, rangeY: 0, maxX: 0, minX: 0, maxY: 0, minY: 0 };
    }

    const xValues = copData.map(p => p.x);
    const yValues = copData.map(p => p.y);

    const maxX = Math.max(...xValues);
    const minX = Math.min(...xValues);
    const maxY = Math.max(...yValues);
    const minY = Math.min(...yValues);

    return {
        rangeX: maxX - minX,
        rangeY: maxY - minY,
        maxX, minX, maxY, minY
    };
}

/**
 * Calcula la Sample Entropy (SampEn) para evaluar la complejidad/regularidad de la señal
 * Valores bajos = más regular/predecible, Valores altos = más irregular/complejo
 * @param {Array} data - Serie temporal unidimensional
 * @param {number} m - Longitud del template (típicamente 2)
 * @param {number} r - Tolerancia (típicamente 0.2 * std)
 * @returns {number} Sample Entropy
 */
export function calculateSampleEntropy(data, m = 2, r = null) {
    const N = data.length;
    if (N < m + 2) return 0;

    // Calcular r como 0.2 * desviación estándar si no se proporciona
    if (r === null) {
        const mean = data.reduce((a, b) => a + b, 0) / N;
        const variance = data.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / N;
        r = 0.2 * Math.sqrt(variance);
    }

    // Función para contar matches
    const countMatches = (templates) => {
        let count = 0;
        for (let i = 0; i < templates.length - 1; i++) {
            for (let j = i + 1; j < templates.length; j++) {
                // Distancia de Chebyshev (máximo de diferencias absolutas)
                let maxDiff = 0;
                for (let k = 0; k < templates[i].length; k++) {
                    maxDiff = Math.max(maxDiff, Math.abs(templates[i][k] - templates[j][k]));
                }
                if (maxDiff < r) count++;
            }
        }
        return count;
    };

    // Crear templates de longitud m
    const templatesM = [];
    for (let i = 0; i <= N - m; i++) {
        templatesM.push(data.slice(i, i + m));
    }

    // Crear templates de longitud m+1
    const templatesM1 = [];
    for (let i = 0; i <= N - m - 1; i++) {
        templatesM1.push(data.slice(i, i + m + 1));
    }

    const Bm = countMatches(templatesM);
    const Am = countMatches(templatesM1);

    if (Bm === 0 || Am === 0) return 0;

    return -Math.log(Am / Bm);
}

/**
 * Calcula el índice de Romberg (comparación OA vs OC)
 * @param {number} metricOC - Valor de la métrica con ojos cerrados
 * @param {number} metricOA - Valor de la métrica con ojos abiertos
 * @returns {number} Índice de Romberg (%)
 */
export function calculateRombergIndex(metricOC, metricOA) {
    if (metricOA <= 0) return 0;
    return ((metricOC - metricOA) / metricOA) * 100;
}
