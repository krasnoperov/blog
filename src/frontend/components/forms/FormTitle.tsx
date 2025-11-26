import { ReactNode } from 'react';
import styles from './Form.module.css';

interface FormTitleProps {
  children: ReactNode;
}

export function FormTitle({ children }: FormTitleProps) {
  return <h1 className={styles.title}>{children}</h1>;
}
