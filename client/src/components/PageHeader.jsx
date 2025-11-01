import { IconButton } from '@mui/material';
import { Close } from '@mui/icons-material';
import { useNavigate } from 'react-router-dom';
import NotificationCenter from './NotificationCenter';
import './PageHeader.css';

const PageHeader = ({ title, showBack = false, backUrl = '/app' }) => {
  const navigate = useNavigate();

  const handleBack = () => {
    navigate(backUrl);
  };

  return (
    <header className="page-header-container">
      <div className="page-header-wrapper">
        <div className="notification-left">
          <NotificationCenter />
        </div>
        
        <div className="header-content-right">
          {showBack && (
            <IconButton 
              onClick={handleBack}
              sx={{ color: 'text.secondary' }}
              title="חזרה"
            >
              <Close />
            </IconButton>
          )}
          <div className="brand-icon">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
              <path d="M20.57 14.86L22 13.43 20.57 12 17 15.57 8.43 7 12 3.43 10.57 2 9.14 3.43 7.71 2 5.57 4.14 4.14 2.71 2.71 4.14l1.43 1.43L2 7.71l1.43 1.43L2 10.57 3.43 12 7 8.43 15.57 17 12 20.57 13.43 22l1.43-1.43L16.29 22l2.14-2.14 1.43 1.43 1.43-1.43-1.43-1.43L22 16.29z" fill="currentColor"/>
            </svg>
          </div>
          <h1>{title || 'GoFit'}</h1>
        </div>
      </div>
    </header>
  );
};

export default PageHeader;
