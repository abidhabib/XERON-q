import React, { useState, useEffect } from 'react';
import {Sidebar} from '../SideBarSection/Sidebar';
import { Button, Table, Modal, Form } from 'react-bootstrap';
import axios from 'axios';

const Bonus = () => {
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(false);
    const [bonusSettings, setBonusSettings] = useState([]);
    const [showModal, setShowModal] = useState(false);
    const [currentSetting, setCurrentSetting] = useState({});

    useEffect(() => {
        fetchBonusSettings();
    }, []);

    const fetchBonusSettings = () => {
        axios.get(`${import.meta.env.VITE_API_BASE_URL}/bonus-settings`)
            .then(response => {
                setBonusSettings(response.data.data);
            })
            .catch(error => {
                setError('Failed to fetch bonus settings');
            });
    };

    
    const handleEdit = (setting) => {
        setCurrentSetting(setting);
        setShowModal(true);
    };

    const handleModalClose = () => {
        setShowModal(false);
        setCurrentSetting({});
    };

    const handleModalSave = () => {
        axios.put(`${import.meta.env.VITE_API_BASE_URL}/bonus-settings/${currentSetting.id}`, currentSetting)
            .then(response => {
                fetchBonusSettings();
                setShowModal(false);
                setSuccess(true);
                setError(null);
            })
            .catch(error => {
                setError('Failed to update bonus setting');
                setShowModal(false);
            });
    };

    const handleChange = (e) => {
        const { name, value } = e.target;
        setCurrentSetting({
            ...currentSetting,
            [name]: value
        });
    };

    return (
        <>
            <div className="home">
                <Sidebar />
                <div className="homeContainer">
                    <div className="w-100 p-5 bg-light">
                       
                        {error && <p className="text-danger">{error}</p>}
                        {success && <p className="alert alert-success mt-3">Successfully !</p>}
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>Need Referrer</th>
                                    <th>Reward</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {bonusSettings.map(setting => (
                                    <tr key={setting.id}>
                                        <td>{setting.need_refferer}</td>
                                        <td>{setting.reward}</td>
                                        <td>
                                            <Button variant="primary" onClick={() => handleEdit(setting)}>
                                                Edit
                                            </Button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>
            </div>

            <Modal show={showModal} onHide={handleModalClose}>
                <Modal.Header closeButton>
                    <Modal.Title>Edit Bonus Setting</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <Form>
                        <Form.Group controlId="need_refferer">
                            <Form.Label>Need Referrer</Form.Label>
                            <Form.Control
                                type="number"
                                name="need_refferer"
                                value={currentSetting.need_refferer}
                                onChange={handleChange}
                            />
                        </Form.Group>
                      
                        <Form.Group controlId="reward">
                            <Form.Label>Reward</Form.Label>
                            <Form.Control
                                type="number"
                                name="reward"
                                value={currentSetting.reward}
                                onChange={handleChange}
                            />
                        </Form.Group>
                    </Form>
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={handleModalClose}>
                        Close
                    </Button>
                    <Button variant="primary" onClick={handleModalSave}>
                        Save Changes
                    </Button>
                </Modal.Footer>
            </Modal>
        </>
    );
};

export default Bonus;
