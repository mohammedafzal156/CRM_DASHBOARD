import React, { useEffect, useState } from 'react';
import { supabase } from '../supabase'; 

function ProjectsView({ searchQuery = '' }) {
    const [leads, setLeads] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);

    // State for Client Details Modal
    const [selectedClient, setSelectedClient] = useState(null);

    useEffect(() => {
        fetchEmployeeLeads();

        // Listen for real-time changes to the 'leads' table
        const channel = supabase
            .channel('projects_leads_changes')
            .on(
                'postgres_changes',
                { event: '*', schema: 'public', table: 'leads' },
                () => fetchEmployeeLeads()
            )
            .subscribe();

        return () => {
            supabase.removeChannel(channel);
        };
    }, []);

    const fetchEmployeeLeads = async () => {
        try {
            setLoading(true);
            // Fetch leads from Supabase ordered by date
            const { data, error } = await supabase
                .from('leads')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setLeads(data || []);
        } catch (err) {
            console.error('Error fetching leads for projects view:', err.message);
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    // Filter leads based on top search bar query
    const filteredLeads = leads.filter((lead) => {
        const clientName = lead.client_name || lead.name || '';
        const assignedTo = lead.employee_id || lead.submitted_by || lead.assigned_to || '';
        const projectId = lead.project_id || lead.id || '';
        const term = searchQuery.toLowerCase();

        return (
            clientName.toLowerCase().includes(term) ||
            assignedTo.toString().toLowerCase().includes(term) ||
            projectId.toString().toLowerCase().includes(term)
        );
    });

    if (loading) return <div className="card p-3 shadow-sm">Loading project details...</div>;
    if (error) return <div className="card p-3 shadow-sm text-danger">Error: {error}</div>;

    return (
        <div className="card p-3 shadow-sm">
            <h4 className="mb-3">Project Details</h4>
            
            <div className="table-responsive">
                <table className="table table-hover align-middle mt-2">
                    <thead className="table-dark">
                        <tr>
                            <th>Project ID</th>
                            <th>Client Name</th>
                            <th>Assigned To</th>
                            <th>Submitted On</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredLeads.length > 0 ? (
                            filteredLeads.map((lead, index) => (
                                <tr key={lead.id || index}>
                                    <td className="fw-bold">
                                        {lead.project_id || `PRJ-${lead.id || index + 1}`}
                                    </td>
                                    <td>
                                        {/* Clickable Hyperlink on Client Name */}
                                        <button
                                            className="btn btn-link p-0 text-decoration-none fw-bold text-dark"
                                            onClick={() => setSelectedClient(lead)}
                                            style={{ cursor: 'pointer' }}
                                        >
                                            {lead.client_name || lead.name || 'N/A'}
                                        </button>
                                    </td>
                                    <td>
                                        {lead.assigned_to || lead.submitted_by || lead.employee_id || 'N/A'}
                                    </td>
                                    <td>
                                        {lead.submitted_at || lead.created_at
                                            ? new Date(lead.submitted_at || lead.created_at).toLocaleDateString('en-IN', {
                                                  year: 'numeric',
                                                  month: 'short',
                                                  day: 'numeric',
                                              })
                                            : 'N/A'}
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="4" className="text-center text-muted py-4">
                                    No project details found.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>

            {/* Client Details Modal */}
            {selectedClient && (
                <div 
                    className="modal fade show d-block" 
                    tabIndex="-1" 
                    style={{ backgroundColor: 'rgba(0,0,0,0.5)' }}
                >
                    <div className="modal-dialog modal-dialog-centered">
                        <div className="modal-content shadow-lg border-0">
                            
                            <div className="modal-header bg-dark text-white">
                                <h5 className="modal-title">📋 Client & Lead Information</h5>
                                <button 
                                    type="button" 
                                    className="btn-close btn-close-white" 
                                    onClick={() => setSelectedClient(null)}
                                ></button>
                            </div>

                            <div className="modal-body p-4">
                                <div className="row g-3">
                                    <div className="col-12">
                                        <small className="text-muted d-block fw-bold">CLIENT NAME</small>
                                        <span className="fs-6 fw-semibold">
                                            {selectedClient.client_name || selectedClient.name || 'N/A'}
                                        </span>
                                    </div>

                                    <div className="col-6">
                                        <small className="text-muted d-block fw-bold">EMAIL ADDRESS</small>
                                        <span className="text-break">{selectedClient.email || 'N/A'}</span>
                                    </div>

                                    <div className="col-6">
                                        <small className="text-muted d-block fw-bold">PHONE NUMBER</small>
                                        <span>{selectedClient.phone || selectedClient.phone_number || 'N/A'}</span>
                                    </div>

                                    <div className="col-12">
                                        <small className="text-muted d-block fw-bold">DESCRIPTION / NOTES</small>
                                        <div className="p-3 bg-light rounded border mt-1 text-wrap" style={{ minHeight: '80px' }}>
                                            {selectedClient.description || selectedClient.notes || selectedClient.details || 'No description provided.'}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            <div className="modal-footer border-0">
                                <button 
                                    type="button" 
                                    className="btn btn-secondary px-4" 
                                    onClick={() => setSelectedClient(null)}
                                >
                                    Close
                                </button>
                            </div>

                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}

export default ProjectsView;