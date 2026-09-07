import React, { useState } from 'react';
import { supabase } from '../supabase';

function NewLeads({ onClose, onSuccess }) {
    const [formData, setFormData] = useState({
        clientName: '',
        email: '',
        phoneNumber: '',
        description: ''
    });
    const [loading, setLoading] = useState(false);
    const [successMessage, setSuccessMessage] = useState('');
    const [errorMessage, setErrorMessage] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);
        setSuccessMessage('');
        setErrorMessage('');

        try {
            // 1. Get current user
            const { data: { user } } = await supabase.auth.getUser();

            const employeeName = user?.user_metadata?.full_name || 
                                 user?.email || 
                                 localStorage.getItem('loggedInUser') || 
                                 'Unknown Employee';

            const customEmpId = user?.user_metadata?.empid || 
                                localStorage.getItem('empId') || 
                                'N/A';

            const submissionTimestamp = new Date().toISOString();

            // 2. Insert lead into database
            const { error } = await supabase
                .from('leads')
                .insert([
                    { 
                        client_name: formData.clientName,
                        email: formData.email,
                        phone_number: formData.phoneNumber,
                        description: formData.description,
                        created_by: employeeName,
                        employee_id: customEmpId,
                        submitted_at: submissionTimestamp,
                        status: 'New'
                    }
                ]);

            if (error) throw error;

            // Show success banner on modal screen
            setSuccessMessage('Submitted successfully!');

            // Optional callback to notify parent component (e.g. to show banner on dashboard)
            if (onSuccess) {
                onSuccess('Submitted successfully!');
            }

            // Close modal after a brief delay so user sees the submission success
            setTimeout(() => {
                if (onClose) onClose();
            }, 1200);

        } catch (error) {
            console.error('Error submitting lead:', error);
            setErrorMessage('Failed to submit lead: ' + (error.message || 'Check database settings'));
        } finally {
            setLoading(false);
        }
    };

    return (
        <div 
            onClick={onClose}
            style={{
                position: 'fixed',
                top: 0,
                left: 0,
                width: '100vw',
                height: '100vh',
                backgroundColor: 'rgba(0, 0, 0, 0.6)',
                backdropFilter: 'blur(4px)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                zIndex: 999999
            }}
        >
            <div 
                className="bg-white p-4 rounded-4 shadow-lg"
                onClick={(e) => e.stopPropagation()}
                style={{ width: '90%', maxWidth: '480px' }}
            >
                <div className="d-flex justify-content-between align-items-center mb-3">
                    <h5 className="m-0 fw-bold text-dark">Add New Lead</h5>
                    <button type="button" className="btn-close" onClick={onClose} disabled={loading}></button>
                </div>

                {/* Success Message Banner */}
                {successMessage && (
                    <div className="alert alert-success text-center py-2 mb-3" role="alert">
                        {successMessage}
                    </div>
                )}

                {/* Error Message Banner */}
                {errorMessage && (
                    <div className="alert alert-danger text-center py-2 mb-3" role="alert">
                        {errorMessage}
                    </div>
                )}

                <form onSubmit={handleSubmit}>
                    <div className="mb-3">
                        <label className="form-label fw-semibold text-dark">Client Name</label>
                        <input 
                            type="text" 
                            name="clientName" 
                            className="form-control" 
                            placeholder="Enter client name"
                            value={formData.clientName} 
                            onChange={handleChange} 
                            required 
                            disabled={loading || Boolean(successMessage)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold text-dark">Email</label>
                        <input 
                            type="email" 
                            name="email" 
                            className="form-control" 
                            placeholder="Enter email address"
                            value={formData.email} 
                            onChange={handleChange} 
                            required 
                            disabled={loading || Boolean(successMessage)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold text-dark">Phone Number</label>
                        <input 
                            type="tel" 
                            name="phoneNumber" 
                            className="form-control" 
                            placeholder="Enter phone number"
                            value={formData.phoneNumber} 
                            onChange={handleChange} 
                            required 
                            disabled={loading || Boolean(successMessage)}
                        />
                    </div>

                    <div className="mb-3">
                        <label className="form-label fw-semibold text-dark">Description</label>
                        <textarea 
                            name="description" 
                            className="form-control" 
                            rows="3" 
                            placeholder="Enter lead details..."
                            value={formData.description} 
                            onChange={handleChange} 
                            required 
                            disabled={loading || Boolean(successMessage)}
                        ></textarea>
                    </div>

                    <div className="d-flex justify-content-end gap-2 mt-4">
                        <button type="button" className="btn btn-light" onClick={onClose} disabled={loading}>
                            Cancel
                        </button>
                        <button 
                            type="submit" 
                            className="btn btn-primary" 
                            style={{ backgroundColor: '#0284c7', borderColor: '#0284c7' }}
                            disabled={loading || Boolean(successMessage)}
                        >
                            {loading ? 'Submitting...' : 'Submit Lead'}
                        </button>
                    </div>
                </form>
            </div>
        </div>
    );
}

export default NewLeads;