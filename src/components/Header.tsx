import React from 'react';
import type { Language } from '../localization/i18n';
import { translations } from '../localization/i18n';
import { ShieldAlert, RotateCcw, Compass, Download } from 'lucide-react';

interface HeaderProps {
  buildingName: string;
  lang: Language;
  onLanguageChange: (lang: Language) => void;
  onReset: () => void;
  onLoadSample: () => void;
  onExportSvg: () => void;
}

export const Header: React.FC<HeaderProps> = ({
  buildingName,
  lang,
  onLanguageChange,
  onReset,
  onLoadSample,
  onExportSvg,
}) => {
  const t = translations[lang];

  return (
    <header className="app-header">
      <div className="header-left">
        <div className="brand-badge">
          <Compass className="brand-icon" size={24} />
          <div className="brand-titles">
            <div className="brand-name-row">
              <h1 className="brand-title">{t.appName}</h1>
              <span className="badge-system-ready">
                <span className="pulse-dot"></span>
                {t.systemActive}
              </span>
            </div>
            <p className="brand-subtitle">{t.appSubtitle}</p>
          </div>
        </div>

        {buildingName && (
          <div className="building-chip">
            <span className="chip-label">{t.currentBuilding}:</span>
            <span className="chip-value">{buildingName}</span>
          </div>
        )}
      </div>

      <div className="header-center">
        <div className="educational-banner" title={t.educationalDisclaimer}>
          <ShieldAlert size={14} className="disclaimer-icon" />
          <span className="disclaimer-text">{t.educationalDisclaimer}</span>
        </div>
      </div>

      <div className="header-right">
        {/* Language Switcher */}
        <div className="lang-switcher" role="group" aria-label="Language Switcher">
          <button
            className={`lang-btn ${lang === 'en' ? 'lang-btn-active' : ''}`}
            onClick={() => onLanguageChange('en')}
            aria-pressed={lang === 'en'}
            title="Switch to English"
          >
            EN
          </button>
          <span className="lang-divider">/</span>
          <button
            className={`lang-btn ${lang === 'bn' ? 'lang-btn-active' : ''}`}
            onClick={() => onLanguageChange('bn')}
            aria-pressed={lang === 'bn'}
            title="বাংলা ভাষায় পরিবর্তন করুন"
          >
            বাংলা
          </button>
        </div>

        {/* Load Sample Demo */}
        <button
          className="header-action-btn btn-secondary"
          onClick={onLoadSample}
          title={t.loadDemo}
        >
          {t.loadDemo}
        </button>

        {/* Export SVG */}
        {buildingName && (
          <button
            className="header-action-btn btn-secondary"
            onClick={onExportSvg}
            title={t.exportMap}
          >
            <Download size={14} />
            <span>SVG</span>
          </button>
        )}

        {/* Reset to Initial State */}
        <button
          className="header-action-btn btn-warning"
          onClick={onReset}
          title={t.resetTooltip}
        >
          <RotateCcw size={15} />
          <span>{t.resetToInitial}</span>
        </button>
      </div>
    </header>
  );
};
