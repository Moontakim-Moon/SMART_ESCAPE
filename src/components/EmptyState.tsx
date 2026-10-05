import React from 'react';
import type { Language } from '../localization/i18n';
import { translations } from '../localization/i18n';
import { Compass, Upload, Sparkles, CheckCircle } from 'lucide-react';

interface EmptyStateProps {
  onLoadDemo: () => void;
  onBrowseFileClick: () => void;
  lang: Language;
}

export const EmptyState: React.FC<EmptyStateProps> = ({
  onLoadDemo,
  onBrowseFileClick,
  lang,
}) => {
  const t = translations[lang];

  return (
    <div className="empty-state-container">
      <div className="empty-state-card">
        <div className="empty-state-icon-box">
          <Compass size={48} className="empty-compass-icon" />
        </div>

        <h2 className="empty-state-title">{t.noDatasetLoaded}</h2>
        <p className="empty-state-description">
          {lang === 'bn'
            ? 'সিমুলেশন শুরু করতে একটি ভবনের টপোলজি JSON ফাইল আপলোড করুন অথবা দ্রুত মূল্যায়নের জন্য অফিসিয়াল ডেমো সিনারিওটি লোড করুন।'
            : 'To initiate the evacuation route simulator, please import a valid building JSON schema file, or instantly load the official AI DevFest practice scenario.'}
        </p>

        <div className="empty-actions">
          <button className="btn-primary-large" onClick={onBrowseFileClick}>
            <Upload size={18} />
            <span>{t.browseFiles}</span>
          </button>
          <button className="btn-secondary-large" onClick={onLoadDemo}>
            <Sparkles size={18} />
            <span>{t.loadDemo}</span>
          </button>
        </div>

        <div className="empty-guide-box">
          <h3 className="guide-title">{t.quickGuide}</h3>
          <ul className="guide-list">
            <li>
              <CheckCircle size={15} className="guide-bullet-icon" />
              <span>{t.instruction1}</span>
            </li>
            <li>
              <CheckCircle size={15} className="guide-bullet-icon" />
              <span>{t.instruction2}</span>
            </li>
            <li>
              <CheckCircle size={15} className="guide-bullet-icon" />
              <span>{t.instruction3}</span>
            </li>
          </ul>
        </div>
      </div>
    </div>
  );
};
