import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from './supabase'; 

function Signup() {
    const [name, setName] = useState('');
    const [empId, setEmpId] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [role, setRole] = useState('Employee');
    
    // States for displaying feedback messages on screen
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');

    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        
        // Reset feedback messages on new submit
        setMessage('');
        setError('');

        // 1. Register user in Supabase Auth
        const { data: authData, error: authError } = await supabase.auth.signUp({
            email: email,
            password: password,
            options: {
                data: {
                    full_name: name,
                    empId: empId,
                    role: role,
                },
            },
        });

        if (authError) {
            console.error('Auth Error:', authError.message);
            setError('Signup failed: ' + authError.message);
            return;
        }

        // 2. Insert details into public.users table (Omit 'id' so database handles auto-increment)
        const { error: dbError } = await supabase
            .from('users')
            .insert([
                {
                    name: name,
                    empId: empId,
                    email: email,
                    role: role,
                },
            ]);

        if (dbError) {
            console.error('Database Insert Error:', dbError.message);
            setError('Account created, but failed to save profile to table: ' + dbError.message);
            return;
        }

        // Save local session keys so profile views display immediately
        localStorage.setItem('loggedInUser', name);
        localStorage.setItem('empId', empId);
        localStorage.setItem('userEmail', email);

        // Show success message on screen
        setMessage('Registration successful!');

        // Delay navigation briefly so the user can read the success message
        setTimeout(() => {
            navigate('/login');
        }, 1500);
    };

    return (
        <div className="d-flex justify-content-center align-items-center bg-secondary vh-100 p-3">
            <div className="bg-white p-4 rounded shadow col-12 col-sm-8 col-md-5 col-lg-4">
                <h2 className="mb-3 text-center">REGISTER</h2>

                {/* On-screen Success Banner */}
                {message && (
                    <div className="alert alert-success text-center" role="alert">
                        {message}
                    </div>
                )}

                {/* On-screen Error Banner */}
                {error && (
                    <div className="alert alert-danger text-center" role="alert">
                        {error}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label htmlFor="name">
                            <strong>Name</strong>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Name"
                            autoComplete="off"
                            name="name"
                            className="form-control"
                            value={name}
                            onChange={(e) => setName(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="empId">
                            <strong>Employee ID</strong>
                        </label>
                        <input
                            type="text"
                            placeholder="Enter Employee ID"
                            autoComplete="off"
                            name="empId"
                            className="form-control"
                            value={empId}
                            onChange={(e) => setEmpId(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="email">
                            <strong>Email</strong>
                        </label>
                        <input
                            type="email"
                            placeholder="Enter Email"
                            autoComplete="off"
                            name="email"
                            className="form-control"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            required
                        />
                    </div>

                    <div className="mb-3">
                        <label htmlFor="password">
                            <strong>Password</strong>
                        </label>
                        <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                            <input
                                type={showPassword ? 'text' : 'password'} 
                                placeholder="Create Password"
                                name="password"
                                className="form-control"
                                style={{ paddingRight: '60px' }}
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                required
                            />
                            <button
                                type="button"
                                onClick={() => setShowPassword(!showPassword)}
                                style={{
                                    position: 'absolute',
                                    right: '10px',
                                    background: 'none',
                                    border: 'none',
                                    color: '#01060e',
                                    cursor: 'pointer',
                                    fontSize: '12px',
                                    fontWeight: 'bold',
                                    padding: 0
                                }}
                            >
                                {showPassword ? 'Hide' : 'Show'}
                            </button>
                        </div>
                    </div>

                    <div className="mb-3">
                        <label htmlFor="role">
                            <strong>Role</strong>
                        </label>
                        <select
                            name="role"
                            id="role"
                            className="form-select"
                            value={role}
                            onChange={(e) => setRole(e.target.value)}
                        >
                            <option value="Admin">Admin</option>
                            <option value="Employee">Employee</option>
                        </select>
                    </div>

                    <button type="submit" className="btn btn-success w-100 mt-2">
                        Register
                    </button>
                </form>
            </div>
        </div>
    );
}

export default Signup;