// src/views/admin/AdminMessagerie.js
import React, { useState, useEffect } from "react";
import {
    Card, CardHeader, CardBody, CardTitle,
    Container, Row, Col, Spinner, Badge
} from "reactstrap";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from "../../services/api";

// ---- HEADER ----
const MessagerieHeader = () => (
    <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
        <Container fluid>
            <div className="header-body">
                <Row>
                    <Col lg="12">
                        <Card className="card-stats mb-4 mb-xl-0 shadow">
                            <CardBody>
                                <Row>
                                    <div className="col">
                                        <CardTitle tag="h5" className="text-uppercase text-muted mb-0">
                                            Messagerie & Support
                                        </CardTitle>
                                        <span className="h1 font-weight-bold mb-0">
                                            Gérez les feedbacks des utilisateurs et promoteurs
                                        </span>
                                    </div>
                                    <Col className="col-auto">
                                        <div className="icon icon-shape bg-purple text-white rounded-circle shadow">
                                            <i className="fas fa-comments" />
                                        </div>
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </div>
        </Container>
    </div>
);

// ---- PAGE PRINCIPALE ----
const AdminMessagerie = () => {
    const [feedbacks, setFeedbacks] = useState([]);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [filter, setFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);

    // Charger les feedbacks au montage
    useEffect(() => {
        fetchFeedbacks();
    }, []);

    // Charger les messages quand on sélectionne un feedback
    useEffect(() => {
        if (selectedFeedback) {
            fetchMessages(selectedFeedback.id);
            const interval = setInterval(() => fetchMessages(selectedFeedback.id), 5000);
            return () => clearInterval(interval);
        }
    }, [selectedFeedback]);

    const fetchFeedbacks = async () => {
        setIsLoading(true);
        try {
            const response = await api.get("/feedback/admin/all");
            setFeedbacks(response.data);
        } catch (error) {
            console.error("Erreur chargement feedbacks:", error);
        } finally {
            setIsLoading(false);
        }
    };

    const fetchMessages = async (feedbackId) => {
        try {
            const response = await api.get(`/feedback/${feedbackId}/messages`);
            setMessages(response.data);
        } catch (error) {
            console.error("Erreur chargement messages:", error);
        }
    };

    const handleSendMessage = async () => {
        if (!newMessage.trim() || !selectedFeedback) return;
        setIsSending(true);
        try {
            await api.post(`/feedback/admin/${selectedFeedback.id}/reply`, { message: newMessage });
            setNewMessage("");
            fetchMessages(selectedFeedback.id);
        } catch (error) {
            console.error("Erreur envoi message:", error);
            alert("Erreur lors de l'envoi du message");
        } finally {
            setIsSending(false);
        }
    };

    // Filtrage
    const filteredFeedbacks = feedbacks.filter(f => {
        if (filter === "all") return true;
        return f.user_type === filter;
    });

    return (
        <>
            <style>{`
                h1,h2,h3,h4,h5,h6,.h1,.h2,.h3,.h4,.h5,.h6 { color: black; font-weight: 600; }
                .chat-message-admin { background: #5e72e4; color: white; }
                .chat-message-user { background: #f7fafc; color: #32325d; }
            `}</style>

            <MessagerieHeader />

            <Container className="mt--7" fluid>
                <Row>
                    <Col xl="12">
                        <Card className="shadow">
                            <CardHeader className="border-0">
                                <Row className="align-items-center">
                                    <Col>
                                        <h3 className="mb-0">Messages reçus</h3>
                                    </Col>
                                    <Col className="text-right">
                                        <Badge
                                            color={filter === "all" ? "primary" : "secondary"}
                                            className="mr-2 cursor-pointer"
                                            style={{ cursor: 'pointer', padding: '8px 12px' }}
                                            onClick={() => { setFilter("all"); setSelectedFeedback(null); }}
                                        >
                                            Tous
                                        </Badge>
                                        <Badge
                                            color={filter === "utilisateur" ? "warning" : "secondary"}
                                            className="mr-2"
                                            style={{ cursor: 'pointer', padding: '8px 12px' }}
                                            onClick={() => { setFilter("utilisateur"); setSelectedFeedback(null); }}
                                        >
                                            Utilisateurs
                                        </Badge>
                                        <Badge
                                            color={filter === "client" ? "info" : "secondary"}
                                            style={{ cursor: 'pointer', padding: '8px 12px' }}
                                            onClick={() => { setFilter("client"); setSelectedFeedback(null); }}
                                        >
                                            Promoteurs
                                        </Badge>
                                    </Col>
                                </Row>
                            </CardHeader>

                            <CardBody className="p-0">
                                <div className="d-flex" style={{ minHeight: '500px' }}>

                                    {/* LISTE DES TICKETS */}
                                    <div
                                        className={`border-right ${selectedFeedback ? 'd-none d-md-block' : ''}`}
                                        style={{ width: selectedFeedback ? '35%' : '100%', overflowY: 'auto', maxHeight: '70vh' }}
                                    >
                                        {isLoading ? (
                                            <div className="text-center p-4"><Spinner /></div>
                                        ) : filteredFeedbacks.length === 0 ? (
                                            <div className="text-center p-4 text-muted">Aucun message</div>
                                        ) : (
                                            <ul className="list-unstyled mb-0">
                                                {filteredFeedbacks.map(feedback => (
                                                    <li
                                                        key={feedback.id}
                                                        className={`p-3 border-bottom ${selectedFeedback?.id === feedback.id ? 'bg-light border-left border-primary' : ''}`}
                                                        style={{ cursor: 'pointer', borderLeftWidth: selectedFeedback?.id === feedback.id ? '4px' : '0' }}
                                                        onClick={() => setSelectedFeedback(feedback)}
                                                    >
                                                        <div className="d-flex justify-content-between align-items-start">
                                                            <div>
                                                                <Badge color={feedback.user_type === 'client' ? 'info' : 'warning'} className="mb-1">
                                                                    {feedback.user_type === 'client' ? 'Promoteur' : 'Utilisateur'}
                                                                </Badge>
                                                                <h5 className="mb-0">{feedback.full_name || "Anonyme"}</h5>
                                                                <small className="text-muted">{feedback.email}</small>
                                                            </div>
                                                            <small className="text-muted">
                                                                {feedback.created_at ? format(new Date(feedback.created_at), 'dd MMM', { locale: fr }) : '-'}
                                                            </small>
                                                        </div>
                                                        <p className="text-sm text-muted mt-2 mb-0" style={{ overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                                                            {feedback.message}
                                                        </p>
                                                    </li>
                                                ))}
                                            </ul>
                                        )}
                                    </div>

                                    {/* ZONE DE CHAT */}
                                    <div
                                        className={`d-flex flex-column ${selectedFeedback ? 'd-block' : 'd-none d-md-flex'}`}
                                        style={{ width: selectedFeedback ? '65%' : '0%', flexGrow: selectedFeedback ? 1 : 0 }}
                                    >
                                        {selectedFeedback ? (
                                            <>
                                                {/* Header Chat */}
                                                <div className="p-3 border-bottom bg-light d-flex justify-content-between align-items-center">
                                                    <div>
                                                        <h4 className="mb-0">{selectedFeedback.full_name}</h4>
                                                        <small className="text-muted">{selectedFeedback.email} • {selectedFeedback.phone}</small>
                                                    </div>
                                                    <button
                                                        className="btn btn-sm btn-secondary d-md-none"
                                                        onClick={() => setSelectedFeedback(null)}
                                                    >
                                                        Retour
                                                    </button>
                                                </div>

                                                {/* Messages List */}
                                                <div className="flex-grow-1 p-3" style={{ overflowY: 'auto', maxHeight: '350px', backgroundColor: '#f4f5f7' }}>
                                                    {messages.map((msg, index) => {
                                                        const isMe = msg.sender_type === 'admin';
                                                        return (
                                                            <div key={index} className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                                                <div
                                                                    className={`px-3 py-2 rounded shadow-sm ${isMe ? 'chat-message-admin' : 'chat-message-user'}`}
                                                                    style={{ maxWidth: '70%' }}
                                                                >
                                                                    <p className="mb-1" style={{ fontSize: '14px' }}>{msg.message}</p>
                                                                    <small className={isMe ? 'text-white-50' : 'text-muted'} style={{ fontSize: '11px' }}>
                                                                        {msg.created_at ? format(new Date(msg.created_at), 'HH:mm', { locale: fr }) : ''}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                </div>

                                                {/* Input Zone */}
                                                <div className="p-3 border-top bg-white">
                                                    <div className="d-flex">
                                                        <input
                                                            type="text"
                                                            className="form-control mr-2"
                                                            placeholder="Écrivez votre réponse..."
                                                            value={newMessage}
                                                            onChange={(e) => setNewMessage(e.target.value)}
                                                            onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                            disabled={isSending}
                                                        />
                                                        <button
                                                            className="btn btn-primary"
                                                            onClick={handleSendMessage}
                                                            disabled={isSending}
                                                        >
                                                            {isSending ? <Spinner size="sm" /> : <i className="fas fa-paper-plane" />}
                                                        </button>
                                                    </div>
                                                </div>
                                            </>
                                        ) : (
                                            <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted">
                                                <i className="fas fa-comments fa-3x mb-3" />
                                                <p>Sélectionnez une conversation pour afficher les détails</p>
                                            </div>
                                        )}
                                    </div>

                                </div>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default AdminMessagerie;