import { Link } from './Link';
import styles from './HeaderNav.module.css';

interface HeaderNavProps {
  userName?: string | null;
  userEmail?: string | null;
  className?: string;
}

export const HeaderNav: React.FC<HeaderNavProps> = ({ userName, userEmail, className }) => {
  const displayName = userName || userEmail || '';

  return (
    <nav className={`${styles.nav} ${className || ''}`}>
      <Link to="/guides" className={styles.navLink}>Guides</Link>
      <Link to="/app" className={styles.navLink}>App</Link>
      <Link to="/profile" className={styles.navLink}>{displayName}</Link>
    </nav>
  );
};
