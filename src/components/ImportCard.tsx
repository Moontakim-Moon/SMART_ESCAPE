import React, { useRef, useState } from 'react';
import type { BuildingGraphData } from '../types/graph';
import type { Language } from '../localization/i18n';
import { translations } from '../localization/i18n';
import { parseAndValidateBuildingJSON } from '../services/validation';
import { samplePresets } from '../data/samplePresets';
import { Upload, FileCode, AlertCircle, CheckCircle2, Download, Sparkles } from 'lucide-react';

interface ImportCardProps {
  onImportSuccess: (data: BuildingGraphData) => void;
  lang: Language;
  hasLoadedDataset: boolean;
}

export const ImportCard: React.FC<ImportCardProps> = ({
  onImportSuccess,
  lang,
  hasLoadedDataset,
}) => {
  const t = translations[lang];
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [validationErrors, setValidationErrors] = useState<string[]>([]);
  const [successNotice, setSuccessNotice] = useState<string | null>(null);
  const [selectedPresetId, setSelectedPresetId] = useState<string>('');

  const processFile = (file: File) => {
    setValidationErrors([]);
    setSuccessNotice(null);

    if (!file.name.toLowerCase().endsWith('.json')) {
      setValidationErrors([t.unsupportedFileType]);
      return;
    }

    const reader = new FileReader();
    reader.onload = (e) => {
      const content = e.target?.result;
      if (typeof content !== 'string') {
        setValidationErrors(['Failed to read file content as text.']);
        return;
      }

      const result = parseAndValidateBuildingJSON(content);
      if (!result.isValid || !result.data) {
        setValidationErrors(result.errors);
      } else {
        setSuccessNotice(`${file.name}: ${t.importSuccess}`);
        onImportSuccess(result.data);
        setTimeout(() => setSuccessNotice(null), 4000);
      }
    };

    reader.onerror = () => {
      setValidationErrors(['Error reading local file from browser File API.']);
    };

    reader.readAsText(file);
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
      e.target.value = '';
    }
  };

  // Load a sample preset directly or fetch it
  const handleLoadPreset = async (presetId: string) => {
    setSelectedPresetId(presetId);
    if (!presetId) return;

    const preset = samplePresets.find((p) => p.id === presetId);
    if (!preset) return;

    if (preset.data) {
      setValidationErrors([]);
      setSuccessNotice(`${preset.name}: ${t.importSuccess}`);
      onImportSuccess(preset.data);
      setTimeout(() => setSuccessNotice(null), 4000);
      return;
    }

    try {
      const res = await fetch(`/sample-datasets/${preset.filename}`);
      if (!res.ok) {
        throw new Error(`HTTP status ${res.status}`);
      }
      const rawText = await res.text();
      const result = parseAndValidateBuildingJSON(rawText);
      if (!result.isValid || !result.data) {
        setValidationErrors(result.errors);
      } else {
        setValidationErrors([]);
        setSuccessNotice(`${preset.name}: ${t.importSuccess}`);
        onImportSuccess(result.data);
        setTimeout(() => setSuccessNotice(null), 4000);
      }
    } catch (err) {
      setValidationErrors([`Could not fetch sample dataset: ${String(err)}`]);
    }
  };

  // Download a preset JSON file to local computer
  const handleDownloadPreset = async (e: React.MouseEvent, filename: string) => {
    e.stopPropagation();
    try {
      const res = await fetch(`/sample-datasets/${filename}`);
      const text = await res.text();
      const blob = new Blob([text], { type: 'application/json' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error('Download failed:', err);
    }
  };

  return (
    <div className="card import-card">
      <div className="card-header">
        <div className="card-title-group">
          <Upload size={17} className="card-icon" />
          <h2 className="card-title">{hasLoadedDataset ? t.replaceDataset : t.importDataset}</h2>
        </div>
      </div>

      <div
        className={`dropzone ${isDragging ? 'dropzone-active' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        role="button"
        tabIndex={0}
        aria-label="Drag and drop or browse JSON building file"
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            fileInputRef.current?.click();
          }
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".json,application/json"
          onChange={handleFileInputChange}
          style={{ display: 'none' }}
          id="building-file-input"
        />
        <FileCode size={28} className="dropzone-icon" />
        <p className="dropzone-text">{t.dropJsonHere}</p>
        <button
          type="button"
          className="btn-browse"
          onClick={(e) => {
            e.stopPropagation();
            fileInputRef.current?.click();
          }}
        >
          {t.browseFiles}
        </button>
      </div>

      {/* Preset Scenarios Quick Loader */}
      <div className="preset-selector-box">
        <div className="preset-header">
          <Sparkles size={14} className="card-icon" />
          <span className="preset-label">
            {lang === 'bn' ? 'নমুনা ডেটাসেটসমূহ' : 'Sample Datasets'}
          </span>
        </div>
        <select
          className="preset-dropdown"
          value={selectedPresetId}
          onChange={(e) => handleLoadPreset(e.target.value)}
          aria-label="Load preset sample scenario"
        >
          <option value="">
            -- {lang === 'bn' ? 'একটি নমুনা নির্বাচন করুন' : 'Select a Test Dataset'} --
          </option>
          {samplePresets.map((preset) => (
            <option key={preset.id} value={preset.id}>
              {preset.name}
            </option>
          ))}
        </select>

        {/* Quick download links */}
        <div className="preset-download-list">
          <span className="download-hint">
            {lang === 'bn' ? 'পরীক্ষার জন্য JSON ফাইল ডাউনলোড করুন:' : 'Download JSON to test local import:'}
          </span>
          <div className="download-chips">
            {samplePresets.map((p) => (
              <button
                key={p.id}
                type="button"
                className="chip-download"
                onClick={(e) => handleDownloadPreset(e, p.filename)}
                title={`Download ${p.filename}`}
              >
                <Download size={11} />
                <span>{p.filename}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Validation Success Banner */}
      {successNotice && (
        <div className="alert-box alert-success" role="status">
          <CheckCircle2 size={16} />
          <span>{successNotice}</span>
        </div>
      )}

      {/* Validation Failure Structured Errors */}
      {validationErrors.length > 0 && (
        <div className="alert-box alert-error" role="alert">
          <div className="alert-error-header">
            <AlertCircle size={17} />
            <strong>{t.validationErrorTitle}</strong>
          </div>
          <p className="alert-error-desc">{t.fixErrorsPrompt}</p>
          <ul className="error-list">
            {validationErrors.map((err, idx) => (
              <li key={idx} className="error-item">
                {err}
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
