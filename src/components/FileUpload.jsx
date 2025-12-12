import { useState, useCallback } from 'react';
import { Upload, FileText, CheckCircle, XCircle, AlertCircle } from 'lucide-react';
import { parseWBBFile, detectCondition } from '../utils/analysisEngine';
import './FileUpload.css';

export default function FileUpload({ onDataLoaded }) {
    const [files, setFiles] = useState({ OA: null, OC: null });
    const [dragActive, setDragActive] = useState(false);
    const [errors, setErrors] = useState({});

    const processFile = useCallback(async (file) => {
        const content = await file.text();
        const result = parseWBBFile(content, file.name);

        if (!result.success) {
            return { ...result, filename: file.name };
        }

        return {
            success: true,
            data: result.data,
            condition: result.condition,
            metadata: result.metadata,
            filename: file.name
        };
    }, []);

    const handleFiles = useCallback(async (fileList) => {
        const newFiles = { ...files };
        const newErrors = { ...errors };

        for (const file of fileList) {
            const result = await processFile(file);
            const condition = result.condition || detectCondition(file.name);

            if (!result.success) {
                newErrors[condition === 'UNKNOWN' ? 'general' : condition] = result.error;
                continue;
            }

            // Limpiar error previo si existe
            delete newErrors[condition];
            delete newErrors['general'];

            if (condition === 'OA') {
                newFiles.OA = result;
            } else if (condition === 'OC') {
                newFiles.OC = result;
            } else {
                // Si no se detecta, preguntar o asignar al primero vacío
                if (!newFiles.OA) {
                    newFiles.OA = { ...result, condition: 'OA' };
                } else if (!newFiles.OC) {
                    newFiles.OC = { ...result, condition: 'OC' };
                }
            }
        }

        setFiles(newFiles);
        setErrors(newErrors);

        // Notificar al componente padre si hay al menos un archivo
        if (newFiles.OA || newFiles.OC) {
            onDataLoaded(newFiles);
        }
    }, [files, errors, processFile, onDataLoaded]);

    const handleDrag = (e) => {
        e.preventDefault();
        e.stopPropagation();
        if (e.type === 'dragenter' || e.type === 'dragover') {
            setDragActive(true);
        } else if (e.type === 'dragleave') {
            setDragActive(false);
        }
    };

    const handleDrop = (e) => {
        e.preventDefault();
        e.stopPropagation();
        setDragActive(false);

        if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
            handleFiles(Array.from(e.dataTransfer.files));
        }
    };

    const handleInputChange = (e) => {
        if (e.target.files && e.target.files.length > 0) {
            handleFiles(Array.from(e.target.files));
        }
    };

    const clearFile = (condition) => {
        setFiles(prev => ({ ...prev, [condition]: null }));
    };

    const FileStatus = ({ file, condition, label }) => {
        if (!file) {
            return (
                <div className="file-slot empty">
                    <AlertCircle size={20} />
                    <span>{label}</span>
                    <small>Sin archivo</small>
                </div>
            );
        }

        return (
            <div className="file-slot loaded">
                <CheckCircle size={20} className="success-icon" />
                <div className="file-info">
                    <span className="file-name">{file.filename}</span>
                    <small>
                        {file.metadata.totalSamples} muestras · {file.metadata.duration.toFixed(1)}s · {file.metadata.samplingRate.toFixed(0)} Hz
                    </small>
                </div>
                <button className="clear-btn" onClick={() => clearFile(condition)}>×</button>
            </div>
        );
    };

    return (
        <div className="file-upload-container">
            <h2>📁 Cargar Datos de Posturografía</h2>
            <p className="subtitle">Archivos de Wii Balance Board (.txt o .csv)</p>

            <div
                className={`drop-zone ${dragActive ? 'active' : ''}`}
                onDragEnter={handleDrag}
                onDragLeave={handleDrag}
                onDragOver={handleDrag}
                onDrop={handleDrop}
            >
                <Upload size={48} strokeWidth={1.5} />
                <p>Arrastra los archivos aquí</p>
                <span>o</span>
                <label className="file-input-label">
                    Seleccionar archivos
                    <input
                        type="file"
                        accept=".txt,.csv"
                        multiple
                        onChange={handleInputChange}
                    />
                </label>
                <small>El sistema detecta automáticamente la condición (OA/OC) según el nombre del archivo</small>
            </div>

            <div className="files-status">
                <FileStatus file={files.OA} condition="OA" label="Ojos Abiertos (OA)" />
                <FileStatus file={files.OC} condition="OC" label="Ojos Cerrados (OC)" />
            </div>

            {Object.keys(errors).length > 0 && (
                <div className="errors-container">
                    {Object.entries(errors).map(([key, error]) => (
                        <div key={key} className="error-message">
                            <XCircle size={16} />
                            <span>{error}</span>
                        </div>
                    ))}
                </div>
            )}

            <div className="format-hint">
                <FileText size={16} />
                <span>
                    <strong>Formato esperado:</strong> timestamp, TL, TR, BL, BR (sin encabezado)
                </span>
            </div>
        </div>
    );
}
