import { ReactNode } from 'react';
import styles from './Form.module.css';

interface FormContainerProps {
  children: ReactNode;
  maxWidth?: number;
  style?: React.CSSProperties;
}

export function FormContainer({ children, maxWidth = 720, style }: FormContainerProps) {
  return (
    <div
      className={styles.formContainer}
      style={{ width: `min(${maxWidth}px, 100%)`, ...style }}
    >
      {children}
    </div>
  );
}
