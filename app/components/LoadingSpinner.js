import React from 'react';
import styles from './LoadingSpinner.module.css';

const LoadingSpinner = () => {
  return (
    <div className={styles.spinnerContainer}>
      <div className={styles.spinner}></div>
      <p>Generating your portfolio...</p>
    </div>
  );
};

export default LoadingSpinner; 