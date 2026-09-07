import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase';

function ProvidedLeads() {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchLeads();
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);

            // 1. Fetch authenticated user details directly from Supabase Auth
            const { data: { user } } = await supabase.auth.getUser();

            // 2. Resolve employee ID dynamically without hardcoded fallback
            const currentEmployeeId = 
                user?.user_metadata?.empid || 
                user?.user_metadata?.employee_id || 
                localStorage.getItem('empId') || 
                localStorage.getItem('employee_id');

            if (!currentEmployeeId) {
                console.warn('No active employee ID found for the current user.');
                setLeads([]);
                return;
            }

            // 3. Query leads matching current employee ID
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .eq('employee_id', currentEmployeeId)
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (err) {
            console.error('Error fetching leads:', err.message);
        } finally {
            setLoading(false);
        }
    };

    // Employee updates status to Completed or Canceled
    const handleStatusUpdate = async (leadId, newStatus) => {
        try {
            setUpdatingId(leadId);

            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus })
                .eq('id', leadId);

            if (error) throw error;

            // Update state locally immediately
            setLeads((prevLeads) =>
                prevLeads.map((lead) =>
                    lead.id === leadId ? { ...lead, status: newStatus } : lead
                )
            );
        } catch (err) {
            console.error('Error updating status:', err.message);
            alert('Failed to update status: ' + err.message);
        } finally {
            setUpdatingId(null);
        }
    };

    // Render status badge or Complete/Cancel buttons
    const renderStatusOrActions = (lead) => {
        const status = lead.status ? lead.status.toLowerCase().trim() : '';

        const badgeStyle = {
            width: '100px',
            display: 'inline-block',
            textAlign: 'center',
            paddingTop: '6px',
            paddingBottom: '6px',
            fontSize: '0.875rem',
            fontWeight: '500'
        };

        if (status === 'accepted') {
            return (
                <div style={{ display: 'flex', gap: '8px' }}>
                    <button
                        className="btn btn-sm btn-outline-success"
                        disabled={updatingId === lead.id}
                        onClick={() => handleStatusUpdate(lead.id, 'Completed')}
                    >
                        {updatingId === lead.id ? '...' : 'Complete'}
                    </button>
                    <button
                        className="btn btn-sm btn-outline-danger"
                        disabled={updatingId === lead.id}
                        onClick={() => handleStatusUpdate(lead.id, 'Canceled')}
                    >
                        {updatingId === lead.id ? '...' : 'Cancel'}
                    </button>
                </div>
            );
        }

        switch (status) {
            case 'completed':
            case 'converted':
            case 'done':
                return (
                    <span className="badge bg-success text-white" style={badgeStyle}>
                        Completed
                    </span>
                );
            case 'canceled':
            case 'cancelled':
                return (
                    <span className="badge bg-secondary text-white" style={badgeStyle}>
                        Canceled
                    </span>
                );
            case 'declined':
            case 'rejected':
            case 'failed':
                return (
                    <span className="badge bg-danger text-white" style={badgeStyle}>
                        Declined
                    </span>
                );
            case 'pending':
            case 'new':
            default:
                return (
                    <span className="badge bg-warning text-dark" style={badgeStyle}>
                        Pending
                    </span>
                );
        }
    };

    if (loading) return <div className="card p-3 shadow-sm">Loading leads...</div>;

    return (
        <div className="card p-3 shadow-sm">
            <h3 className="text-dark mb-2 fs-4 fw-semibold">Provided Leads</h3>
            <p className="text-muted">Manage your assigned leads.</p>

            <div className="table-responsive">
                <table className="table table-hover mt-3 align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>Lead ID</th>
                            <th>Client Name</th>
                            <th>Submitted By</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {leads.length === 0 ? (
                            <tr>
                                <td colSpan="4" className="text-center text-muted">
                                    No leads found.
                                </td>
                            </tr>
                        ) : (
                            leads.map((lead, index) => (
                                <tr key={lead.id || index}>
                                    <td>{index + 1}</td>
                                    <td>{lead.client_name || lead.name || 'N/A'}</td>
                                    <td>{lead.employee_id || lead.created_by || 'N/A'}</td>
                                    <td>{renderStatusOrActions(lead)}</td>
                                </tr>
                            ))
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default ProvidedLeads;