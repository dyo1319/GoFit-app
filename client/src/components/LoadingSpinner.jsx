import './LoadingSpinner.css';

const LoadingSpinner = () => {
  return (
    <div className="loading-container" dir="rtl">
      <div className="loading-spinner">
        <div className="spinner"></div>
        <p>טוען…</p>
      </div>
    </div>
  );
};

export default LoadingSpinner;
