# 🏥 PosturoAnalyzer - FallRisk Lab

**Aplicación web profesional para análisis de posturografía y evaluación del riesgo de caídas**

![PosturoAnalyzer](https://img.shields.io/badge/Status-Active-success)
![React](https://img.shields.io/badge/React-19.2.0-blue)
![Vite](https://img.shields.io/badge/Vite-7.2.4-646CFF)

## 📋 Descripción

PosturoAnalyzer es una herramienta clínica avanzada diseñada para analizar datos de posturografía obtenidos mediante la Wii Balance Board (WBB). La aplicación procesa datos biomecánicos, calcula métricas de estabilidad postural y evalúa el riesgo de caídas en pacientes.

### ✨ Características Principales

- 📊 **Análisis Biomecánico Completo**
  - Procesamiento de archivos `.txt` y `.csv` de Wii Balance Board
  - Cálculo del Centro de Presión (COP)
  - Métricas de estabilidad: longitud, velocidad, área de elipse
  - Análisis de Sample Entropy

- 🔬 **Evaluación Clínica**
  - Detección automática de condiciones (Ojos Abiertos/Ojos Cerrados)
  - Índices de Romberg (comparación OA vs OC)
  - Algoritmo de evaluación de riesgo de caídas
  - Interpretación clínica automática

- 📈 **Visualización Profesional**
  - Estatocinesigrama (gráfico X-Y del COP)
  - Estabilograma (evolución temporal)
  - Indicadores visuales de riesgo
  - Dashboard interactivo

- 👤 **Gestión de Datos Clínicos**
  - Formulario de información del paciente
  - Integración de datos demográficos
  - Historial de caídas previas

## 🚀 Inicio Rápido

### Prerrequisitos

- Node.js (versión 16 o superior)
- npm o yarn

### Instalación

```bash
# Clonar el repositorio
git clone https://github.com/elcosmonauta/fallrisk-lab.git

# Navegar al directorio
cd fallrisk-lab

# Instalar dependencias
npm install

# Iniciar servidor de desarrollo
npm run dev
```

La aplicación estará disponible en `http://localhost:5173`

## 📦 Scripts Disponibles

```bash
npm run dev      # Inicia el servidor de desarrollo
npm run build    # Construye la aplicación para producción
npm run preview  # Previsualiza la build de producción
npm run lint     # Ejecuta el linter
```

## 🏗️ Estructura del Proyecto

```
posturografia_app/
├── src/
│   ├── components/
│   │   ├── FileUpload.jsx/.css        # Carga de archivos WBB
│   │   ├── ClinicalForm.jsx/.css      # Formulario clínico
│   │   └── ResultsDashboard.jsx/.css  # Dashboard de resultados
│   ├── utils/
│   │   ├── wbbMath.js                 # Cálculos matemáticos
│   │   └── analysisEngine.js          # Motor de análisis
│   ├── App.jsx/.css                   # Componente principal
│   └── main.jsx                       # Punto de entrada
├── public/
│   ├── sample_ojos_abiertos.txt       # Datos de prueba OA
│   └── sample_ojos_cerrados.txt       # Datos de prueba OC
└── index.html
```

## 📖 Uso de la Aplicación

### 1. Cargar Datos de Posturografía

- Arrastra y suelta archivos `.txt` o `.csv` de la Wii Balance Board
- Formato esperado: `timestamp, TL, TR, BL, BR` (sin encabezado)
- La aplicación detecta automáticamente la condición (OA/OC) por el nombre del archivo

### 2. Completar Datos Clínicos

- Ingresa información del paciente (edad, género, peso, altura)
- Registra historial de caídas previas
- Añade notas clínicas adicionales

### 3. Analizar Resultados

- Revisa las métricas de estabilidad calculadas
- Examina los gráficos de Estatocinesigrama y Estabilograma
- Evalúa el nivel de riesgo de caídas
- Lee la interpretación clínica automática

## 🔬 Métricas Calculadas

| Métrica | Descripción |
|---------|-------------|
| **Longitud COP** | Distancia total recorrida por el centro de presión |
| **Velocidad Media** | Velocidad promedio del desplazamiento del COP |
| **Área de Elipse** | Área de confianza del 95% del COP |
| **Sample Entropy** | Medida de complejidad y regularidad del movimiento |
| **Índice de Romberg** | Ratio OC/OA para evaluar dependencia visual |

## 🛠️ Tecnologías Utilizadas

- **React 19.2** - Framework de UI
- **Vite 7.2** - Build tool y dev server
- **Recharts 3.5** - Librería de gráficos
- **Lucide React** - Iconos
- **CSS Modules** - Estilos modulares

## 📄 Formato de Datos

Los archivos de entrada deben seguir este formato:

```
0.000,23.5,24.1,22.8,23.2
0.020,23.6,24.0,22.9,23.1
0.040,23.4,24.2,22.7,23.3
...
```

Donde:
- Columna 1: Timestamp (segundos)
- Columna 2: Sensor Top-Left (kg)
- Columna 3: Sensor Top-Right (kg)
- Columna 4: Sensor Bottom-Left (kg)
- Columna 5: Sensor Bottom-Right (kg)

## 🎯 Casos de Uso

- **Clínicas de Fisioterapia**: Evaluación de pacientes con trastornos del equilibrio
- **Centros Geriátricos**: Prevención de caídas en adultos mayores
- **Investigación**: Estudios sobre control postural y estabilidad
- **Rehabilitación**: Seguimiento de progreso en terapias de equilibrio

## 🤝 Contribuciones

Las contribuciones son bienvenidas. Por favor:

1. Fork el proyecto
2. Crea una rama para tu feature (`git checkout -b feature/AmazingFeature`)
3. Commit tus cambios (`git commit -m 'Add some AmazingFeature'`)
4. Push a la rama (`git push origin feature/AmazingFeature`)
5. Abre un Pull Request

## 📝 Licencia

Este proyecto está bajo la Licencia MIT.

## 👥 Autores

- **Universidad Viña del Mar** - Programa de Kinesiología

## 🙏 Agradecimientos

- Equipo de desarrollo de la Wii Balance Board
- Comunidad de investigación en posturografía
- Contribuidores del proyecto

---

**⚠️ Nota Importante**: Esta aplicación es una herramienta de apoyo clínico y no reemplaza el juicio profesional de un especialista en salud.
