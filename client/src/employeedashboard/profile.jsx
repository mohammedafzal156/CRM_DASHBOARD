import React, { useState, useEffect } from 'react';
import { supabase } from '../supabase';

function Profile({ userName, onClose }) {
    const [profile, setProfile] = useState({
        id: null,
        name: '',
        email: '',
        empId: '',
        phone: 'Not Provided',
        address: 'Not Provided',
        role: 'Employee'
    });

    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [isEditing, setIsEditing] = useState(false);
    const [formData, setFormData] = useState({ ...profile });

    useEffect(() => {
        fetchCurrentUserProfile();
    }, [userName]);

    const fetchCurrentUserProfile = async () => {
        try {
            setLoading(true);

            // 1. Get logged-in user session details from Auth
            const { data: { user: authUser } } = await supabase.auth.getUser();

            const currentEmail = authUser?.email || localStorage.getItem('userEmail');
            const currentEmpId = localStorage.getItem('empId');
            const currentName = userName || localStorage.getItem('loggedInUser');

            // 2. Query 'users' table using valid text/matching fields (email, empId, or name)
            let query = supabase.from('users').select('*');

            if (currentEmail) {
                query = query.eq('email', currentEmail);
            } else if (currentEmpId) {
                query = query.or(`emp_id.eq.${currentEmpId},empId.eq.${currentEmpId}`);
            } else if (currentName) {
                query = query.or(`name.ilike.${currentName.trim()},full_name.ilike.${currentName.trim()}`);
            }

            const { data, error } = await query.maybeSingle();

            if (error) {
                console.error('Error fetching employee profile:', error.message);
            }

            if (data) {
                const loadedProfile = {
                    id: data.id,
                    name: data.name || data.full_name || currentName || 'N/A',
                    email: data.email || currentEmail || authUser?.email || 'N/A',
                    empId: data.emp_id || data.empId || currentEmpId || 'N/A',
                    phone: data.phone || data.phone_number || 'Not Provided',
                    address: data.address || 'Not Provided',
                    role: data.role || authUser?.user_metadata?.role || 'Employee'
                };
                setProfile(loadedProfile);
                setFormData(loadedProfile);
            } else {
                // Fallback for newly logged-in user without pre-existing table row
                const fallbackProfile = {
                    id: null,
                    name: currentName || authUser?.user_metadata?.full_name || 'Employee',
                    email: currentEmail || authUser?.email || 'N/A',
                    empId: currentEmpId || 'N/A',
                    phone: 'Not Provided',
                    address: 'Not Provided',
                    role: authUser?.user_metadata?.role || 'Employee'
                };
                setProfile(fallbackProfile);
                setFormData(fallbackProfile);
            }
        } catch (err) {
            console.error('Profile fetch error:', err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setFormData((prev) => ({
            ...prev,
            [name]: value
        }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setUpdating(true);

        try {
            const updatePayload = {
                name: formData.name,
                email: formData.email,
                phone: formData.phone === 'Not Provided' ? '' : formData.phone,
                address: formData.address === 'Not Provided' ? '' : formData.address
            };

            let updateQuery = supabase.from('users').update(updatePayload);

            if (profile.id) {
                updateQuery = updateQuery.eq('id', profile.id);
            } else if (profile.email && profile.email !== 'N/A') {
                updateQuery = updateQuery.eq('email', profile.email);
            } else {
                updateQuery = updateQuery.ilike('name', profile.name);
            }

            const { error } = await updateQuery;

            if (error) throw error;

            setProfile({ ...formData });
            setIsEditing(false);
            alert('Profile updated successfully!');
        } catch (err) {
            console.error('Error updating profile:', err.message);
            alert('Failed to update profile: ' + err.message);
        } finally {
            setUpdating(false);
        }
    };

    return (
        <div className="modal show d-block" style={{ backgroundColor: 'rgba(15, 23, 42, 0.6)', zIndex: 1050 }}>
            <div className="modal-dialog modal-dialog-centered modal-lg">
                <div className="modal-content shadow-lg border-0 rounded-4">
                    
                    {/* Header */}
                    <div className="modal-header border-bottom-0 px-4 pt-4">
                        <h4 className="modal-title fw-bold text-dark">
                            {isEditing ? '✏️ Edit Profile' : '👤 My Profile'}
                        </h4>
                        <button type="button" className="btn-close" onClick={onClose}></button>
                    </div>

                    {loading ? (
                        <div className="modal-body p-5 text-center text-muted">
                            <div className="spinner-border text-primary mb-2" role="status"></div>
                            <div>Loading employee data...</div>
                        </div>
                    ) : isEditing ? (
                        /* EDIT FORM */
                        <form onSubmit={handleSubmit}>
                            <div className="modal-body p-4">
                                <div className="row g-3">
                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Full Name</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="name"
                                            value={formData.name}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Email Address</label>
                                        <input
                                            type="email"
                                            className="form-control"
                                            name="email"
                                            value={formData.email}
                                            onChange={handleChange}
                                            required
                                        />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Emp ID</label>
                                        <input
                                            type="text"
                                            className="form-control bg-light"
                                            value={formData.empId}
                                            readOnly
                                        />
                                    </div>

                                    <div className="col-12 col-md-6">
                                        <label className="form-label fw-semibold text-secondary">Phone Number</label>
                                        <input
                                            type="text"
                                            className="form-control"
                                            name="phone"
                                            value={formData.phone === 'Not Provided' ? '' : formData.phone}
                                            onChange={handleChange}
                                            placeholder="Enter phone number"
                                        />
                                    </div>

                                    <div className="col-12">
                                        <label className="form-label fw-semibold text-secondary">Address</label>
                                        <textarea
                                            className="form-control"
                                            name="address"
                                            rows="3"
                                            value={formData.address === 'Not Provided' ? '' : formData.address}
                                            onChange={handleChange}
                                            placeholder="Enter address"
                                        ></textarea>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer border-top-0 px-4 pb-4">
                                <button type="button" className="btn btn-outline-secondary px-4" onClick={() => setIsEditing(false)}>
                                    Cancel
                                </button>
                                <button type="submit" className="btn btn-primary px-4" disabled={updating}>
                                    {updating ? 'Saving...' : 'Save Changes'}
                                </button>
                            </div>
                        </form>
                    ) : (
                        /* DISPLAY MODE */
                        <>
                            <div className="modal-body p-4">
                                <div className="row g-4">
                                    <div className="col-12 col-md-6">
                                        <label className="text-muted small fw-bold d-block text-uppercase">Full Name</label>
                                        <p className="fs-5 fw-semibold mb-0 text-dark">{profile.name}</p>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="text-muted small fw-bold d-block text-uppercase">Role</label>
                                        <p className="fs-5 fw-semibold mb-0">
                                            <span className={`badge ${profile.role === 'Admin' ? 'bg-danger' : 'bg-primary'} text-white`}>
                                                {profile.role}
                                            </span>
                                        </p>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="text-muted small fw-bold d-block text-uppercase">Emp ID</label>
                                        <p className="fs-5 fw-semibold mb-0 text-dark">{profile.empId}</p>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="text-muted small fw-bold d-block text-uppercase">Email ID</label>
                                        <p className="fs-5 fw-semibold mb-0 text-dark">{profile.email}</p>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="text-muted small fw-bold d-block text-uppercase">Phone Number</label>
                                        <p className="fs-5 fw-semibold mb-0 text-dark">{profile.phone}</p>
                                    </div>
                                    <div className="col-12 col-md-6">
                                        <label className="text-muted small fw-bold d-block text-uppercase">Address</label>
                                        <p className="fs-5 fw-semibold mb-0 text-dark">{profile.address}</p>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer border-top-0 px-4 pb-4">
                                <button type="button" className="btn btn-light px-4" onClick={onClose}>
                                    Close
                                </button>
                                <button type="button" className="btn btn-primary px-4" onClick={() => setIsEditing(true)}>
                                    ✏️ Edit Profile
                                </button>
                            </div>
                        </>
                    )}

                </div>
            </div>
        </div>
    );
}

export default Profile;