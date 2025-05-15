import { Link, useNavigate } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth } from '../firebase';

import "../styles/Navbar.css";

import { NavLink } from 'react-router-dom';

export default function Navbar({ isAdmin }) {
  return (
    <nav>
      <NavLink to="/home" className={({ isActive }) => isActive ? "active" : ""}>
        Home
      </NavLink>
      <NavLink to="/roster" className={({ isActive }) => isActive ? "active" : ""}>
        Roster
      </NavLink>
      <NavLink to="/messages" className={({ isActive }) => isActive ? "active" : ""}>
        Messages
      </NavLink>
      {isAdmin && (
        <NavLink to="/management" className={({ isActive }) => isActive ? "active" : ""}>
          Management
        </NavLink>
      )}
      <NavLink to="/settings" className={({ isActive }) => isActive ? "active" : ""}>
        Settings
      </NavLink>
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