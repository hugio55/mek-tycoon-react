import React from 'react';
import styles from './GeneratingLoader.module.css';

const GeneratingLoader = () => {
  return (
    <div className={styles['loader-wrapper']}>
      <span className={styles['loader-letter']}>G</span>
      <span className={styles['loader-letter']}>e</span>
      <span className={styles['loader-letter']}>n</span>
      <span className={styles['loader-letter']}>e</span>
      <span className={styles['loader-letter']}>r</span>
      <span className={styles['loader-letter']}>a</span>
      <span className={styles['loader-letter']}>t</span>
      <span className={styles['loader-letter']}>i</span>
      <span className={styles['loader-letter']}>n</span>
      <span className={styles['loader-letter']}>g</span>
      <div className={styles.loader} />
    </div>
  );
}

export default GeneratingLoader;
