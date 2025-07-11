import React, { useEffect, useState } from 'react';
import {Sidebar} from '../SideBarSection/Sidebar';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

const Commission = () => {
    const [commissionData, setCommissionData] = useState([]);
    const [error, setError] = useState(null);
    const [updateData, setUpdateData] = useState({ id: '', direct_bonus: '', indirect_bonus: '' });
    const [showModal, setShowModal] = useState(false);
const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fetchCommissionData`);
            if (response.data.status === 'success' && Array.isArray(response.data.data)) {
                setCommissionData(response.data.data); 
                setIsLoading(false);
            } else {
                setError('Commission data is not in the expected format');
            }
        } catch (error) {
            console.error('Error fetching commission data:', error);
            setError('Error fetching data');
        }
    };

    const handleUpdate = (item) => {
        setUpdateData({ ...item });
        setShowModal(true); // Show the modal
    };

    const handleInputChange = (e) => {
        const { name, value } = e.target;
        setUpdateData(prevData => ({ ...prevData, [name]: value }));
    };

    const handleSave = async () => {
        try {
            const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/updateCommissionData`, {
                id: updateData.id,
                direct_bonus: updateData.direct_bonus,
                indirect_bonus: updateData.indirect_bonus,
            });
            if (response.data.status === 'success') {
                setShowModal(false); // Close the modal after saving
                fetchData(); // Fetch updated data
                setUpdateData({ id: '', direct_bonus: '', indirect_bonus: '' }); // Clear placeholders
            } else {
                setError('Failed to update data');
            }
        } catch (error) {
            console.error('Error updating data:', error);
            setError('Failed to update data');
        }
    };

    return (
        <>
        {
            isLoading && (
null
            )
        }
            <div className="home">
                <Sidebar />
                <div className="homeContainer">
                    <h1>Commission Data</h1>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <table className="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Member</th>
                                <th>Direct Bonus</th>
                                <th>Indirect Bonus</th>
                                <th>Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            {commissionData.map(item => (
                                <tr key={item.id}>
                                    <td>{item.person}</td>
                                    <td>{item.direct_bonus}</td>
                                    <td>{item.indirect_bonus}</td>
                                    <td>
                                        <button className="btn btn-primary" onClick={() => handleUpdate(item)}>Update</button>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                    {/* Modal */}
                    <div className={`modal ${showModal ? 'show' : ''}`} tabIndex="-1" role="dialog" style={{ display: showModal ? 'block' : 'none' }}>
                        <div className="modal-dialog" role="document">
                            <div className="modal-content">
                                <div className="modal-header">
                                    <h5 className="modal-title">Update Data</h5>
                                    <button type="button" className="close" onClick={() => setShowModal(false)}>
                                        <span aria-hidden="true">&times;</span>
                                    </button>
                                </div>
                                <div className="modal-body">
                                    <div>
                                        <label>Direct Bonus:</label>
                                        <input type="text" name="direct_bonus" value={updateData.direct_bonus} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label>Indirect Bonus:</label>
                                        <input type="text" name="indirect_bonus" value={updateData.indirect_bonus} onChange={handleInputChange} />
                                    </div>
                                </div>
                                <div className="modal-footer">
                                    <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Close</button>
                                    <button type="button" className="btn btn-primary" onClick={handleSave}>Save changes</button>
                                </div>
                            </div>
                        </div>
                    </div>
                </div>
            </div>
        </>
    );
};

export default Commission;
