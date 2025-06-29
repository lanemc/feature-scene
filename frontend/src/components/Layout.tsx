import { ReactNode } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, 
  Lightbulb, 
  BarChart3, 
  Clock 
} from 'lucide-react';
import styles from './Layout.module.css';

interface LayoutProps {
  children: ReactNode;
}

function Layout({ children }: LayoutProps) {
  const location = useLocation();
  
  const navigation = [
    { name: 'Dashboard', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Insights', href: '/insights', icon: Lightbulb },
    { name: 'Analytics', href: '/analytics', icon: BarChart3 },
    { name: 'Batch Jobs', href: '/batch-jobs', icon: Clock },
  ];

  return (
    <div className={styles.layout}>
      <aside className={styles.sidebar}>
        <div className={styles.logo}>
          <h2>Feature Scene</h2>
          <p>Analytics Dashboard</p>
        </div>
        
        <nav className={styles.navigation}>
          {navigation.map((item) => {
            const Icon = item.icon;
            const isActive = location.pathname === item.href;
            
            return (
              <Link
                key={item.name}
                to={item.href}
                className={`${styles.navItem} ${isActive ? styles.active : ''}`}
              >
                <Icon size={20} />
                <span>{item.name}</span>
              </Link>
            );
          })}
        </nav>
      </aside>
      
      <main className={styles.main}>
        <div className={styles.content}>
          {children}
        </div>
      </main>
    </div>
  );
}

export default Layout;