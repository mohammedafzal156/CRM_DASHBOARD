import React, { useState } from 'react';
import { Link, useNavigate } from "react-router-dom";
import { supabase } from './supabase';

const Login = () => {
    const [empId, setEmpId] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        const { data: userData, error: userError } = await supabase
            .from('users')
            .select('email')
            .eq('empId', empId)
            .single();

        if (userError || !userData?.email) {
            console.error('Error fetching user by empId:', userError);
            setError('Invalid Employee ID or user not found.');
            return;
        }

        const { data, error: authError } = await supabase.auth.signInWithPassword({
            email: userData.email,
            password: password,
        });

        if (authError) {
            console.error('Error logging in:', authError.message);
            setError(authError.message);
            return;
        }

        const user = data.user;
        const userRole = user?.user_metadata?.role?.toLowerCase();

        const userEmpId = user?.user_metadata?.employee_id || user?.user_metadata?.empId || empId;

        const hasRaInEmpId = /ra/i.test(userEmpId);

        const userName = 
            user?.user_metadata?.full_name || 
            user?.user_metadata?.name || 
            user?.email?.split('@')[0] || 
            'User';

        localStorage.setItem('loggedInUser', userName);

        if (userRole === 'admin' && hasRaInEmpId) {
            console.log('Admin login successful:', user);
            navigate('/admindashboard');
        } else if (userRole === 'employee') {
            console.log('Employee login successful:', user);
            navigate('/employeedashboard');
        } else {
            console.warn('Access denied');
            setError('Access Denied: You do not have permission to access the dashboard.');
            await supabase.auth.signOut();
        }
    };

    return (
        <div style={styles.container}>
            <div style={styles.card}>
                <h2 style={styles.title}>LOGIN</h2>
                
                {error && <p style={styles.error}>{error}</p>}

                <form onSubmit={handleSubmit}>
                    <div style={styles.inputGroup}>
                        <label htmlFor="empId" style={styles.label}>Employee ID</label>
                        <input 
                            type="text" 
                            id="empId"
                            placeholder="Enter Employee ID" 
                            value={empId}
                            onChange={(e) => setEmpId(e.target.value)}
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label htmlFor="password" style={styles.label}>Password</label>
                        <div style={styles.passwordWrapper}>
                            <input 
                                type={showPassword ? 'text' : 'password'} 
                                id="password"
                                placeholder="Enter Password" 
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                                style={styles.passwordInput}
                            />
                            <button 
                                type="button" 
                                style={styles.toggleButton} 
                                onClick={() => setShowPassword(!showPassword)}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <button type="submit" style={styles.button}>
                        Login
                    </button>
                </form>

                <p style={styles.footerText}>Don't Have an Account?</p>
                <Link to="/register" style={styles.registerLink}>
                    <button type="button" style={styles.secondaryButton}>
                        Register
                    </button>
                </Link>
            </div>
        </div>
    );
};

const styles = {
    container: {
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        height: '100vh',
        backgroundColor: '#6c757d'
    },
    card: {
        backgroundColor: '#ffffff',
        padding: '30px',
        borderRadius: '8px',
        width: '350px',
        boxShadow: '0 4px 8px rgba(0, 0, 0, 0.1)',
        textAlign: 'left'
    },
    title: {
        fontSize: '24px',
        fontWeight: 'bold',
        marginBottom: '20px',
        color: '#333',
        textAlign: 'center'
    },
    inputGroup: {
        marginBottom: '15px'
    },
    label: {
        display: 'block',
        fontSize: '14px',
        fontWeight: 'bold',
        marginBottom: '5px',
        color: '#212529'
    },
    input: {
        width: '100%',
        padding: '10px',
        fontSize: '14px',
        borderRadius: '4px',
        border: '1px solid #ced4da',
        boxSizing: 'border-box'
    },
    passwordWrapper: {
        position: 'relative',
        display: 'flex',
        alignItems: 'center'
    },
    passwordInput: {
        width: '100%',
        padding: '10px',
        paddingRight: '60px',
        fontSize: '14px',
        borderRadius: '4px',
        border: '1px solid #ced4da',
        boxSizing: 'border-box'
    },
    toggleButton: {
        position: 'absolute',
        right: '10px',
        background: 'none',
        border: 'none',
        color: '#01060e',
        cursor: 'pointer',
        fontSize: '12px',
        fontWeight: 'bold'
    },
    button: {
        width: '100%',
        padding: '10px',
        backgroundColor: '#198754',
        color: '#fff',
        border: 'none',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer',
        marginTop: '10px'
    },
    secondaryButton: {
        width: '100%',
        padding: '10px',
        backgroundColor: '#f8f9fa',
        color: '#212529',
        border: '1px solid #ced4da',
        borderRadius: '4px',
        fontSize: '16px',
        cursor: 'pointer'
    },
    footerText: {
        textAlign: 'center',
        margin: '15px 0 10px',
        fontSize: '14px',
        color: '#6c757d'
    },
    registerLink: {
        textDecoration: 'none'
    },
    error: {
        color: 'red',
        fontSize: '14px',
        marginBottom: '10px'
    }
};

export default Login;