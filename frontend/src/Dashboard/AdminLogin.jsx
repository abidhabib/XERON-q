import  { useContext, useEffect, useState } from 'react';
import '../Dashboard/AdminLogin.css';
import { useNavigate } from 'react-router-dom';
import Axios from 'axios';
import { UserContext } from '../UserContext/UserContext';
import { jwtDecode } from 'jwt-decode';
const AdminLogin = () => {
    const { setAdminAuthenticated } = useContext(UserContext);
    const [isLoading, setIsLoading] = useState(false);
    const [loginUserName, setLoginUserName] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const navigateTo = useNavigate();
    const [loginStatus, setLoginStatus] = useState('');

    useEffect(() => {
        const token = localStorage.getItem('adminToken');
        if (token) {
            try {
                const decoded = jwtDecode(token); 
                if (decoded.exp * 1000 > Date.now()) {
                    setAdminAuthenticated(true);
                    navigateTo('/adminpanel');
                }
            } catch (error) {
                localStorage.removeItem('adminToken');
            }
        }
    }, []);


    const loginUser = async (e) => {
        e.preventDefault();
        setIsLoading(true);
        
        if (!loginUserName || !loginPassword) {
          setLoginStatus('Please enter username and password!');
          setIsLoading(false);
          return;
        }
        
        try {
          const response = await Axios.post(
            `${import.meta.env.VITE_API_BASE_URL}/admin-login`,
            {
              LoginUserName: loginUserName, 
              LoginPassword: loginPassword  
            },
            {
              headers: {
                'Content-Type': 'application/json'
              }
            }
          );
      
          if (response.data.token) {
            const decoded = jwtDecode(response.data.token);
            
            if (decoded.isAdmin !== true) {
              throw new Error('Invalid admin credentials');
            }
            
            localStorage.setItem('adminToken', response.data.token);
            setAdminAuthenticated(true);
            navigateTo('/adminpanel');
          } else {
            setLoginStatus(response.data.message || 'Authentication failed');
          }
        } catch (error) {
          setLoginStatus(error.response?.data?.message || 'Authentication failed');
        } finally {
          setLoginUserName('');
          setLoginPassword('');
          setIsLoading(false);
        }
      };
    useEffect(() => {
        if (loginStatus) {
            const timer = setTimeout(() => setLoginStatus(''), 2000);
            return () => clearTimeout(timer);
        }
    }, [loginStatus]);

    return (
        <div className="admin-form">
            <form className="form_container" onSubmit={loginUser}>
                <div className="title_container">
                </div>
                
                {loginStatus && (
                    <div className="status-message showMessage">
                        {loginStatus}
                    </div>
                )}
                
                <div className="input_container">
                    <label className="input_label" htmlFor="email_field">
                        Mail
                    </label>
                    <input
                        type="text"
                        className="input_field"
                        id="email_field"
                        value={loginUserName}
                        onChange={(e) => setLoginUserName(e.target.value)}
                        autoComplete="off"
                    />
                </div>
                
                <div className="input_container">
                    <label className="input_label" htmlFor="password_field">
                        Password
                    </label>
                    <input
                        type="password"
                        className="input_field"
                        id="password_field"
                        value={loginPassword}
                        onChange={(e) => setLoginPassword(e.target.value)}
                        autoComplete="current-password"
                    />
                </div>
                
                <button 
                    type="submit" 
                    className="sign-in_btn one" 
                    disabled={isLoading}
                >
                    {isLoading ? (
                        <div className="spinner"></div>
                    ) : (
                        <span> Sign In</span>
                    )}
                </button>
            </form>
        </div>
    );
};

export default AdminLogin;