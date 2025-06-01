import { getAuth, signInWithEmailAndPassword, setPersistence, browserLocalPersistence } from 'firebase/auth'
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
    console.log("Handling login...");
  
    setError('');
    setLoading(true);
  
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("✅ Sign-in success", userCredential.user);
  
      // Plan -> It returns an error when something is wrong, so if there is a timer to detect an error after 10 seconds then it could check firebase to find employee data
      navigate('/home');
    } catch (error) {
      console.error("❌ Sign-in failed", error);
      setError('Failed to sign in. Check credentials or network.');
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