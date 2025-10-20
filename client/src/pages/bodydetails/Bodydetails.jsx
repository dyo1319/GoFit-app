import React from 'react';
import PageHeader from '../../components/PageHeader';
import BodyDetailsModal from '../../components/BodyDetailsModal';
import './BodyDetailsModal.css'; 

const BodyDetailsPage = () => (
  <div className="page-container" dir="rtl">
    <PageHeader />
    <div className="page-content">
      <div className="page-header">
        <div className="page-title">
          <h1>ממדי גוף</h1>
        </div>
        <p>מדדים, היסטוריה והתקדמות</p>
      </div>
      <BodyDetailsModal isOpen={true} onClose={() => {}} />
    </div>
  </div>
);

export default BodyDetailsPage;
