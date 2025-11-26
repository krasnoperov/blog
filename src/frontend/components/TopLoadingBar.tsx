import { useEffect, useState } from 'react';
import styles from './TopLoadingBar.module.css';

interface TopLoadingBarProps {
  isLoading: boolean;
}

export const TopLoadingBar: React.FC<TopLoadingBarProps> = ({ isLoading }) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (isLoading) {
      setIsVisible(true); // eslint-disable-line react-hooks/set-state-in-effect
    } else {
      // Delay hiding to allow completion animation
      const timer = setTimeout(() => setIsVisible(false), 300);
      return () => clearTimeout(timer);
    }
  }, [isLoading]);

  if (!isVisible) return null;

  return (
    <div className={styles.container}>
      <div className={`${styles.bar} ${!isLoading ? styles.complete : ''}`} />
    </div>
  );
};
