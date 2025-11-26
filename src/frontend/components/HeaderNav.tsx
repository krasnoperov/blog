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
      {/* Add your navigation links here */}
      <Link to="/profile" className={styles.navLink}>{displayName}</Link>
    </nav>
  );
};
