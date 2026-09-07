import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

function ProfileView({ setDashboardUserName }) {
    const [isEditing, setIsEditing] = useState(false);
    const [loading, setLoading] = useState(false);
    const [statusMessage, setStatusMessage] = useState(null); // { type: 'success' | 'danger', text: '' }
    const [formData, setFormData] = useState({
        name: 'Loading...',
        email: 'Loading...',
        empId: 'Loading...',
        role: 'Loading...',
        companyName: 'Connect & Co.',
        companyAddress: 'N0.9/2, Innovation way, Tech Park, Chennai 635601'
    });

    useEffect(() => {
        const fetchUserData = async () => {
            const { data: { user } } = await supabase.auth.getUser();

            if (user) {
                setFormData({
                    name: user.user_metadata?.full_name || localStorage.getItem('loggedInUser') || 'N/A',
                    email: user.email || localStorage.getItem('userEmail') || 'N/A',
                    empId: user.user_metadata?.empid || localStorage.getItem('empId') || 'N/A',
                    role: user.user_metadata?.role || localStorage.getItem('userRole') || 'Employee',
                    companyName: 'Connect & Co.',
                    companyAddress: 'N0.9/2, Innovation way, Tech Park, Chennai 635601'
                });
            } else {
                setFormData({
                    name: localStorage.getItem('loggedInUser') || 'N/A',
                    email: localStorage.getItem('userEmail') || 'N/A',
                    empId: localStorage.getItem('empId') || 'N/A',
                    role: localStorage.getItem('userRole') || 'Employee',
                    companyName:'Connect & Co.',
                    companyAddress: 'N0.9/2, Innovation way, Tech Park, Chennai 635601'
                });
            }
        };

        fetchUserData();
    }, []);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({ ...prev, [name]: value }));
    };

    const handleSave = async (e) => {
        e.preventDefault();
        setLoading(true);
        setStatusMessage(null);

        const { error } = await supabase.auth.updateUser({
            email: formData.email,
            data: {
                full_name: formData.name,
                empid: formData.empId,
                role: formData.role
            }
        });

        if (error) {
            setStatusMessage({ type: 'danger', text: 'Failed to update profile: ' + error.message });
        } else {
            localStorage.setItem('loggedInUser', formData.name);
            localStorage.setItem('userEmail', formData.email);
            localStorage.setItem('empId', formData.empId);
            localStorage.setItem('userRole', formData.role);

            if (setDashboardUserName) {
                setDashboardUserName(formData.name);
            }

            setStatusMessage({ type: 'success', text: 'Profile updated successfully!' });
            setIsEditing(false);

            // Hide success banner after 3 seconds
            setTimeout(() => {
                setStatusMessage(null);
            }, 3000);
        }

        setLoading(false);
    };

    return (
        <div className="card p-4 shadow-sm" style={{ maxWidth: '800px' }}>
            {/* Inline Banner Notification */}
            {statusMessage && (
                <div className={`alert alert-${statusMessage.type} alert-dismissible fade show mb-3 py-2 px-3 small`} role="alert">
                    {statusMessage.text}
                    <button 
                        type="button" 
                        className="btn-close py-2" 
                        onClick={() => setStatusMessage(null)}
                    ></button>
                </div>
            )}

            <div className="d-flex align-items-center justify-content-between mb-4 pb-3 border-bottom">
                <div className="d-flex align-items-center gap-3">
                    <div 
                        className="bg-primary text-white rounded-circle d-flex align-items-center justify-content-center fs-3 font-weight-bold" 
                        style={{ width: '60px', height: '60px' }}
                    >
                        {formData.name !== 'Loading...' ? formData.name.charAt(0).toUpperCase() : 'U'}
                    </div>
                    <div>
                        <h4 className="m-0">{formData.name}</h4>
                        <span className="badge bg-secondary">{formData.role}</span>
                    </div>
                </div>

                {!isEditing && (
                    <button className="btn btn-outline-primary" onClick={() => setIsEditing(true)}>
                        ✏️ Edit Profile
                    </button>
                )}
            </div>

            {isEditing ? (
                <form onSubmit={handleSave}>
                    <div className="row g-3">
                        <div className="col-md-6">
                            <label className="form-label text-muted fw-bold mb-1">Full Name</label>
                            <input
                                type="text"
                                name="name"
                                className="form-control"
                                value={formData.name}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label text-muted fw-bold mb-1">Employee ID</label>
                            <input
                                type="text"
                                name="empId"
                                className="form-control"
                                value={formData.empId}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label text-muted fw-bold mb-1">Email Address</label>
                            <input
                                type="email"
                                name="email"
                                className="form-control"
                                value={formData.email}
                                onChange={handleChange}
                                required
                            />
                        </div>

                        <div className="col-md-6">
                            <label className="form-label text-muted fw-bold mb-1">Role</label>
                            <select
                                name="role"
                                className="form-select"
                                value={formData.role}
                                onChange={handleChange}
                            >
                                <option value="Admin">Admin</option>
                                <option value="Employee">Employee</option>
                            </select>
                        </div>
                    </div>

                    <div className="d-flex gap-2 mt-4">
                        <button type="submit" className="btn btn-success" disabled={loading}>
                            {loading ? 'Saving...' : '💾 Save Changes'}
                        </button>
                        <button type="button" className="btn btn-secondary" onClick={() => setIsEditing(false)}>
                            ❌ Cancel
                        </button>
                    </div>
                </form>
            ) : (
                <div className="row g-3">
                    <div className="col-md-6">
                        <label className="form-label text-muted fw-bold mb-1">Full Name</label>
                        <div className="p-2 bg-light border rounded">{formData.name}</div>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label text-muted fw-bold mb-1">Employee ID</label>
                        <div className="p-2 bg-light border rounded">{formData.empId}</div>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label text-muted fw-bold mb-1">Email Address</label>
                        <div className="p-2 bg-light border rounded">{formData.email}</div>
                    </div>

                    <div className="col-md-6">
                        <label className="form-label text-muted fw-bold mb-1">Role</label>
                        <div className="p-2 bg-light border rounded">{formData.role}</div>
                    </div>
                    <div className="col-md-6">
                        <label className="form-label text-muted fw-bold mb-1">Company Name</label>
                        <div className="p-2 bg-light border rounded">{formData.companyName}</div>
                    </div>

                    <div className="col-12">
                        <label className="form-label text-muted fw-bold mb-1">Company Address</label>
                        <div className="p-2 bg-light border rounded">{formData.companyAddress}</div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProfileView;