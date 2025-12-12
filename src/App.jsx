import { useState, useCallback } from 'react';
import { Activity, FileText, ClipboardList, BarChart3, Info } from 'lucide-react';
import FileUpload from './components/FileUpload';
import ClinicalForm from './components/ClinicalForm';
import ResultsDashboard from './components/ResultsDashboard';
import './App.css';

function App() {
  const [filesData, setFilesData] = useState(null);
  const [clinicalData, setClinicalData] = useState({
    age: '',
    fallHistory: 0,
    hasLowerLimbFracture: false,
    medicationCount: 0,
    conditions: {
      vestibular: false,
      visual: false,
      proprioceptive: false,
      neuropathy: false,
      muscleWeakness: false,
    }
  });
  const [activeTab, setActiveTab] = useState('upload');

  const handleDataLoaded = useCallback((data) => {
    setFilesData(data);
    // Auto-navigate to results if we have at least one file
    if (data.OA || data.OC) {
      setActiveTab('results');
    }
  }, []);

  const handleClinicalDataChange = useCallback((data) => {
    setClinicalData(data);
  }, []);

  const tabs = [
    { id: 'upload', label: 'Cargar Datos', icon: FileText },
    { id: 'clinical', label: 'Datos Clínicos', icon: ClipboardList },
    { id: 'results', label: 'Resultados', icon: BarChart3 },
  ];

  const hasData = filesData?.OA || filesData?.OC;

  return (
    <div className="app">
      <header className="app-header">
        <div className="header-content">
          <div className="logo">
            <Activity size={32} strokeWidth={2} />
            <div className="logo-text">
              <h1>Fallrisk Lab</h1>
              <span>Sistema de Análisis de Posturografía</span>
            </div>
          </div>
          <div className="header-badge">
            <Info size={14} />
            <span>Evaluación de Riesgo de Caídas</span>
          </div>
        </div>
      </header>

      <nav className="app-nav">
        <div className="nav-content">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isDisabled = tab.id === 'results' && !hasData;
            return (
              <button
                key={tab.id}
                className={`nav-tab ${activeTab === tab.id ? 'active' : ''} ${isDisabled ? 'disabled' : ''}`}
                onClick={() => !isDisabled && setActiveTab(tab.id)}
                disabled={isDisabled}
              >
                <Icon size={18} />
                <span>{tab.label}</span>
                {tab.id === 'results' && hasData && (
                  <span className="badge">
                    {(filesData.OA ? 1 : 0) + (filesData.OC ? 1 : 0)}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </nav>

      <main className="app-main">
        <div className="main-content">
          {activeTab === 'upload' && (
            <FileUpload onDataLoaded={handleDataLoaded} />
          )}

          {activeTab === 'clinical' && (
            <ClinicalForm
              onDataChange={handleClinicalDataChange}
              initialData={clinicalData}
            />
          )}

          {activeTab === 'results' && (
            <ResultsDashboard
              filesData={filesData}
              clinicalData={clinicalData}
            />
          )}
        </div>
      </main>

      <footer className="app-footer">
        <p>
          PosturoAnalyzer v1.0 · Desarrollado para uso clínico profesional ·
          Los resultados deben ser interpretados por profesionales de la salud calificados
        </p>
      </footer>
    </div>
  );
}

export default App;
