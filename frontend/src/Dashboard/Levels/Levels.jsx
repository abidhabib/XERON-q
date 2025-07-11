import  { useEffect, useState } from 'react';
import {Sidebar} from '../SideBarSection/Sidebar';
import axios from 'axios';
import 'bootstrap/dist/css/bootstrap.min.css'; // Import Bootstrap CSS

const Levels = () => {
    const [levelsData, setLevelsData] = useState([]);
    const [error, setError] = useState(null);
    const [updateData, setUpdateData] = useState({ id: '', min_team: null, max_team: null, level: null });
    const [showModal, setShowModal] = useState(false);
    const [isLoading, setIsLoading] = useState(true);
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            const response = await axios.get(`${import.meta.env.VITE_API_BASE_URL}/fetchLevelsData`);
            if (response.data.status === 'success' && Array.isArray(response.data.data)) {
                setLevelsData(response.data.data);
                setIsLoading(false);

            } else {
                setError('Levels data is not in the expected format');
            }
        } catch (error) {
            console.error('Error fetching levels data:', error);
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
            const response = await axios.put(`${import.meta.env.VITE_API_BASE_URL}/updateLevelData`, updateData);
            if (response.data.status === 'success') {
                setShowModal(false); // Close the modal after saving
                fetchData(); // Fetch updated data
                setUpdateData({ id: '', min_team: null, max_team: null, level: null }); // Clear placeholders
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
isLoading &&(
null)

        }
            <div className="home">
                <Sidebar />
                <div className="homeContainer">
                    <h1>Levels Data</h1>
                    {error && <div className="alert alert-danger">{error}</div>}
                    <table className="table table-striped table-bordered">
                        <thead>
                            <tr>
                                <th>Min Team</th>
                                <th>Max Team</th>
                                <th>Level</th>
                                <th>Update</th>
                            </tr>
                        </thead>
                        <tbody>
                            {levelsData.map(item => (
                                <tr key={item.id}>
                                    <td>{item.min_team}</td>
                                    <td>{item.max_team}</td>
                                    <td>{item.level}</td>
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
                                        <label>Min Team:</label>
                                        <input type="number" name="min_team" value={updateData.min_team || ''} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label>Max Team:</label>
                                        <input type="number" name="max_team" value={updateData.max_team || ''} onChange={handleInputChange} />
                                    </div>
                                    <div>
                                        <label>Level:</label>
                                        <input type="number" name="level" value={updateData.level || ''} onChange={handleInputChange} />
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

export default Levels;
