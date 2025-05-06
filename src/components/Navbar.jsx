import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

export default function Navbar({isAdmin}) {


  return (
    <nav style={styles.nav}>
      <Link style={styles.link} to="/home">Home</Link>
      <Link style={styles.link} to="/roster">Roster</Link>
      <Link style={styles.link} to="/messages">Messages</Link>
      {isAdmin && <Link style={styles.link} to="/management">Management</Link>}
      <Link style={styles.link} to="/settings">Settings</Link>
    </nav>
  );
}

const styles = {
    nav: {
      display: 'flex',
      gap: '1rem',
      padding: '1rem',
      backgroundColor: '#f0f0f0',
      borderBottom: '1px solid #ccc',
      justifyContent: 'space-between',
      alignItems: 'center'
    },
    link: {
      textDecoration: 'none',
      color: 'blue',
      fontWeight: 'bold'
    },
    button: {
      padding: '0.5rem 1rem',
      backgroundColor: '#ff4d4f',
      color: 'white',
      border: 'none',
      borderRadius: '4px',
      cursor: 'pointer'
    }
  };