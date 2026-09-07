import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase'; 

function LeadsView({ searchQuery = '', statusFilters = {} }) {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [updatingId, setUpdatingId] = useState(null);

    useEffect(() => {
        fetchLeads();

        // Listen for real-time status updates from Supabase
        const channel = supabase
            .channel('leads_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leads' },
                () => {
                    fetchLeads(); // Auto-refresh leads when any row updates
                }
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchLeads = async () => {
        try {
            setLoading(true);
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (err) {
            console.error('Error fetching leads:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleStatusUpdate = async (leadId, newStatus) => {
        try {
            setUpdatingId(leadId);
            
            const { error } = await supabase
                .from('leads')
                .update({ status: newStatus })
                .eq('id', leadId);

            if (error) throw error;

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

    // Helper for fixed-size status badge styling with centered text
    const renderStatusBadge = (status) => {
        const normalizedStatus = status?.toString().toLowerCase().trim();

        const badgeStyle = {
            width: '100px',
            display: 'inline-block',
            textAlign: 'center',
            paddingTop: '6px',
            paddingBottom: '6px',
        };

        switch (normalizedStatus) {
            case 'accepted':
            case 'completed':
            case 'converted':
            case 'done':
                return (
                    <span className="badge bg-success" style={badgeStyle}>
                        {status}
                    </span>
                );
            case 'canceled':
            case 'cancelled':
                return (
                    <span className="badge bg-secondary" style={badgeStyle}>
                        {status}
                    </span>
                );
            case 'declined':
            case 'rejected':
            case 'failed':
                return (
                    <span className="badge bg-danger" style={badgeStyle}>
                        {status}
                    </span>
                );
            case 'in progress':
            case 'pending':
            case 'new':
            case 'new / pending':
            default:
                return (
                    <span className="badge bg-secondary" style={badgeStyle}>
                        {status || 'New / Pending'}
                    </span>
                );
        }
    };

    // 1. Get list of active status checkboxes (e.g. ['completed'])
    const activeStatuses = Object.keys(statusFilters).filter((key) => statusFilters[key]);

    // 2. Filter leads based on searchQuery and selected status checkboxes
    const filteredLeads = leads.filter((lead) => {
        const q = searchQuery.toLowerCase().trim();
        const matchesSearch = q === '' || JSON.stringify(lead).toLowerCase().includes(q);

        const currentStatus = (lead.status || '').toString().toLowerCase().trim();
        
        // Handle pending status variations
        let mappedStatus = currentStatus;
        if (!currentStatus || currentStatus === 'new' || currentStatus === 'new / pending') {
            mappedStatus = 'pending';
        } else if (currentStatus === 'accepted' || currentStatus === 'converted' || currentStatus === 'done') {
            mappedStatus = 'completed';
        } else if (currentStatus === 'cancelled') {
            mappedStatus = 'canceled';
        }

        const matchesStatus =
            activeStatuses.length === 0 || activeStatuses.includes(mappedStatus);

        return matchesSearch && matchesStatus;
    });

    if (loading) return <div className="card p-3 shadow-sm">Loading leads...</div>;
    if (error) return <div className="card p-3 shadow-sm text-danger">Error: {error}</div>;

    return (
        <div className="card p-3 shadow-sm">
            <h4>Leads Submitted by Employees</h4>
            <div className="table-responsive">
                <table className="table table-hover mt-3 align-middle">
                    <thead className="table-dark">
                        <tr>
                            <th>Lead ID</th>
                            <th>Client Name</th>
                            <th>Submitted By (Emp ID)</th>
                            <th>Submitted At (IST)</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.length === 0 ? (
                            <tr>
                                <td colSpan="5" className="text-center py-3 text-muted">
                                    No leads match the selected status filters.
                                </td>
                            </tr>
                        ) : (
                            filteredLeads.map((lead, index) => {
                                const currentStatus = lead.status?.toString().toLowerCase().trim();
                                const isPending = !lead.status || currentStatus === 'new' || currentStatus === 'pending' || currentStatus === 'new / pending';

                                return (
                                    <tr key={lead.id}>
                                        <td>{index + 1}</td>
                                        <td>{lead.client_name || lead.name}</td>
                                        <td>{lead.employee_id || lead.submitted_by}</td>
                                        <td>
                                            {lead.submitted_at || lead.created_at
                                                ? new Date(lead.submitted_at || lead.created_at).toLocaleString('en-IN', {
                                                      timeZone: 'Asia/Kolkata',
                                                      dateStyle: 'short',
                                                      timeStyle: 'short',
                                                  })
                                                : 'N/A'}
                                        </td>
                                        <td>
                                            {isPending ? (
                                                <div className="d-flex gap-2">
                                                    <button
                                                        className="btn btn-sm btn-success"
                                                        disabled={updatingId === lead.id}
                                                        onClick={() => handleStatusUpdate(lead.id, 'Completed')}
                                                    >
                                                        {updatingId === lead.id ? '...' : 'Accept'}
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        disabled={updatingId === lead.id}
                                                        onClick={() => handleStatusUpdate(lead.id, 'Declined')}
                                                    >
                                                        {updatingId === lead.id ? '...' : 'Decline'}
                                                    </button>
                                                </div>
                                            ) : (
                                                renderStatusBadge(lead.status)
                                            )}
                                        </td>
                                    </tr>
                                );
                            })
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default LeadsView;