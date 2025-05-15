import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '../firebase';
import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/Authorisation.css'
import logo from '../assets/logo-placeholder.jpg';

export default function Authorisation() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  useEffect(()=>{
    console.log("Auth component loaded");
  },[])

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await signInWithEmailAndPassword(auth, email, password);
      navigate('/home'); // Redirect after login
    } catch (error) {
      setError(error.message); // Display error message below the form
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="grey-background">
    <form onSubmit={handleLogin}>
    <img src={logo} className="logo-image"/>
      <h1>Login</h1>
      <input
        type="email"
        placeholder="Email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      /><br />
      <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        required
      /><br />
      {error && <p style={{ color: 'red' }}>{error}</p>}
      <button type="submit" disabled={loading}>
        {loading ? 'Logging in...' : 'Login'}
      </button>
    </form>
    </div>
  );
}