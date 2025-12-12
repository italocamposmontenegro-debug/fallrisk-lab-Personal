import { useState } from 'react';
import { User, Calendar, Pill, Activity, Eye, Ear, Hand, Footprints } from 'lucide-react';
import './ClinicalForm.css';

export default function ClinicalForm({ onDataChange, initialData = {} }) {
    const [formData, setFormData] = useState({
        age: initialData.age || '',
        fallHistory: initialData.fallHistory || 0,
        hasLowerLimbFracture: initialData.hasLowerLimbFracture || false,
        medicationCount: initialData.medicationCount || 0,
        conditions: {
            vestibular: initialData.conditions?.vestibular || false,
            visual: initialData.conditions?.visual || false,
            proprioceptive: initialData.conditions?.proprioceptive || false,
            neuropathy: initialData.conditions?.neuropathy || false,
            muscleWeakness: initialData.conditions?.muscleWeakness || false,
        }
    });

    const handleChange = (field, value) => {
        const newData = { ...formData };

        if (field.startsWith('conditions.')) {
            const conditionKey = field.split('.')[1];
            newData.conditions = { ...newData.conditions, [conditionKey]: value };
        } else {
            newData[field] = value;
        }

        setFormData(newData);
        onDataChange(newData);
    };

    const Checkbox = ({ id, label, icon: Icon, checked, onChange }) => (
        <label className={`condition-checkbox ${checked ? 'checked' : ''}`}>
            <input
                type="checkbox"
                id={id}
                checked={checked}
                onChange={(e) => onChange(e.target.checked)}
            />
            <div className="checkbox-content">
                {Icon && <Icon size={18} />}
                <span>{label}</span>
            </div>
        </label>
    );

    return (
        <div className="clinical-form-container">
            <h2>📋 Datos Clínicos del Paciente</h2>
            <p className="subtitle">Información para el cálculo de riesgo de caídas</p>

            <div className="form-grid">
                {/* Edad */}
                <div className="form-group">
                    <label htmlFor="age">
                        <Calendar size={16} />
                        Edad (años)
                    </label>
                    <input
                        type="number"
                        id="age"
                        min="0"
                        max="120"
                        value={formData.age}
                        onChange={(e) => handleChange('age', parseInt(e.target.value) || '')}
                        placeholder="65"
                    />
                </div>

                {/* Historial de caídas */}
                <div className="form-group">
                    <label htmlFor="fallHistory">
                        <Activity size={16} />
                        Caídas en último año
                    </label>
                    <div className="number-stepper">
                        <button
                            type="button"
                            onClick={() => handleChange('fallHistory', Math.max(0, formData.fallHistory - 1))}
                        >
                            −
                        </button>
                        <span>{formData.fallHistory}</span>
                        <button
                            type="button"
                            onClick={() => handleChange('fallHistory', formData.fallHistory + 1)}
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Número de medicamentos */}
                <div className="form-group">
                    <label htmlFor="medicationCount">
                        <Pill size={16} />
                        Medicamentos habituales
                    </label>
                    <div className="number-stepper">
                        <button
                            type="button"
                            onClick={() => handleChange('medicationCount', Math.max(0, formData.medicationCount - 1))}
                        >
                            −
                        </button>
                        <span>{formData.medicationCount}</span>
                        <button
                            type="button"
                            onClick={() => handleChange('medicationCount', formData.medicationCount + 1)}
                        >
                            +
                        </button>
                    </div>
                </div>

                {/* Fractura MMII */}
                <div className="form-group full-width">
                    <Checkbox
                        id="fracture"
                        label="Antecedente de fractura en extremidades inferiores"
                        icon={Footprints}
                        checked={formData.hasLowerLimbFracture}
                        onChange={(v) => handleChange('hasLowerLimbFracture', v)}
                    />
                </div>
            </div>

            <div className="conditions-section">
                <h3>Condiciones que afectan el equilibrio</h3>
                <div className="conditions-grid">
                    <Checkbox
                        id="vestibular"
                        label="Patología vestibular"
                        icon={Ear}
                        checked={formData.conditions.vestibular}
                        onChange={(v) => handleChange('conditions.vestibular', v)}
                    />
                    <Checkbox
                        id="visual"
                        label="Déficit visual significativo"
                        icon={Eye}
                        checked={formData.conditions.visual}
                        onChange={(v) => handleChange('conditions.visual', v)}
                    />
                    <Checkbox
                        id="proprioceptive"
                        label="Alteración propioceptiva"
                        icon={Hand}
                        checked={formData.conditions.proprioceptive}
                        onChange={(v) => handleChange('conditions.proprioceptive', v)}
                    />
                    <Checkbox
                        id="neuropathy"
                        label="Neuropatía periférica"
                        icon={Activity}
                        checked={formData.conditions.neuropathy}
                        onChange={(v) => handleChange('conditions.neuropathy', v)}
                    />
                    <Checkbox
                        id="muscleWeakness"
                        label="Debilidad muscular en MMII"
                        icon={Footprints}
                        checked={formData.conditions.muscleWeakness}
                        onChange={(v) => handleChange('conditions.muscleWeakness', v)}
                    />
                </div>
            </div>
        </div>
    );
}
