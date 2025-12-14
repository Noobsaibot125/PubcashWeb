// src/views/admin/AdminMessagerie.js
import React, { useState, useEffect, useRef } from "react";
import {
  Card, CardBody, Container, Row, Col, Spinner, Badge,
  Input, Button, InputGroup, InputGroupAddon
} from "reactstrap";
import { format } from 'date-fns';
import { fr } from 'date-fns/locale';
import api from "../../services/api";
import { getMediaUrl } from "../../utils/mediaUrl";

// --- UTILITAIRES ---
// Fonction pour générer des initiales à partir d'un nom
const getInitials = (name) => {
  if (!name) return "U";
  const names = name.split(' ');
  let initials = names[0].substring(0, 1).toUpperCase();
  if (names.length > 1) {
    initials += names[names.length - 1].substring(0, 1).toUpperCase();
  }
  return initials;
};

// Fonction pour générer une couleur de fond aléatoire pour l'avatar (optionnel, sinon garder une fixe)
const getAvatarColor = (type) => {
    return type === 'client' ? 'bg-gradient-info' : 'bg-gradient-warning';
};


const AdminMessagerie = () => {
    // --- ÉTATS & LOGIQUE (Inchangé) ---
    const [feedbacks, setFeedbacks] = useState([]);
    const [selectedFeedback, setSelectedFeedback] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [filter, setFilter] = useState("all");
    const [isLoading, setIsLoading] = useState(false);
    const [isSending, setIsSending] = useState(false);
    const [adminFile, setAdminFile] = useState(null);
    
    // Références
    const adminFileRef = useRef(null);
    const messagesEndRef = useRef(null); // Pour le scroll automatique

    // Charger les feedbacks au montage
    useEffect(() => {
        fetchFeedbacks();
    }, []);

    // Scroll automatique vers le bas quand les messages changent
    useEffect(() => {
        if (messagesEndRef.current) {
            messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
        }
    }, [messages]);

    // Charger les messages + Polling
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
        if ((!newMessage.trim() && !adminFile) || !selectedFeedback) return;
        setIsSending(true);
        try {
            const formData = new FormData();
            formData.append('message', newMessage);
            if (adminFile) formData.append('file', adminFile);

            await api.post(`/feedback/admin/${selectedFeedback.id}/reply`, formData, {
                headers: { 'Content-Type': 'multipart/form-data' }
            });
            setNewMessage("");
            setAdminFile(null);
            if (adminFileRef.current) adminFileRef.current.value = '';
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
            {/* --- STYLES CSS INJECTÉS --- */}
            <style>{`
                .messenger-container { height: 85vh; min-height: 600px; display: flex; flex-direction: column; }
                .card-messenger { height: 100%; border-radius: 15px; overflow: hidden; border: none; box-shadow: 0 0 2rem 0 rgba(136, 152, 170, .15); }
                
                /* Sidebar Liste */
                .chat-list-col { background: #fff; border-right: 1px solid #e9ecef; height: 100%; display: flex; flex-direction: column; }
                .chat-list-header { padding: 20px; border-bottom: 1px solid #e9ecef; background: #fff; }
                .chat-list-items { overflow-y: auto; flex-grow: 1; }
                .chat-item { padding: 15px 20px; cursor: pointer; transition: all 0.2s; border-bottom: 1px solid #f6f9fc; }
                .chat-item:hover { background-color: #f6f9fc; }
                .chat-item.active { background-color: #f4f5f7; border-left: 4px solid #5e72e4; }
                
                /* Avatars */
                .avatar-circle { width: 45px; height: 45px; border-radius: 50%; display: flex; align-items: center; justify-content: center; color: white; font-weight: bold; font-size: 18px; margin-right: 15px; box-shadow: 0 2px 5px rgba(0,0,0,0.1); }
                
                /* Zone de Chat */
                .chat-window-col { background: #fff; display: flex; flex-direction: column; height: 100%; }
                .chat-header { padding: 15px 25px; border-bottom: 1px solid #e9ecef; background: #fff; display: flex; align-items: center; justify-content: space-between; height: 70px;}
                .chat-body { flex-grow: 1; padding: 25px; overflow-y: auto; background-color: #f8f9fe; background-image: radial-gradient(#e9ecef 1px, transparent 1px); background-size: 20px 20px; }
                
                /* Bulles de messages */
                .message-row { display: flex; margin-bottom: 15px; }
                .message-row.me { justify-content: flex-end; }
                .message-bubble { max-width: 70%; padding: 12px 18px; position: relative; font-size: 0.95rem; line-height: 1.5; box-shadow: 0 1px 2px rgba(0,0,0,0.05); }
                
                .message-bubble.them { background: #fff; color: #525f7f; border-radius: 18px 18px 18px 0; border: 1px solid #e9ecef; }
                .message-bubble.me { background: #5e72e4; color: white; border-radius: 18px 18px 0 18px; background: linear-gradient(87deg, #5e72e4 0, #825ee4 100%); }
                
                .message-time { font-size: 0.7rem; margin-top: 5px; opacity: 0.7; display: block; text-align: right; }
                .message-bubble.them .message-time { text-align: left; }

                /* Zone Input */
                .chat-footer { padding: 20px; background: #fff; border-top: 1px solid #e9ecef; }
                .chat-input { border-radius: 30px; padding-left: 20px; border: 1px solid #e9ecef; background: #f6f9fc; height: 45px; }
                .chat-input:focus { background: #fff; box-shadow: none; border-color: #5e72e4; }
                .btn-send { border-radius: 50%; width: 45px; height: 45px; padding: 0; display: flex; align-items: center; justify-content: center; box-shadow: 0 4px 6px rgba(50,50,93,.11), 0 1px 3px rgba(0,0,0,.08); }
                
                /* Scrollbar custom */
                ::-webkit-scrollbar { width: 6px; }
                ::-webkit-scrollbar-track { background: transparent; }
                ::-webkit-scrollbar-thumb { background: #ced4da; border-radius: 3px; }
                ::-webkit-scrollbar-thumb:hover { background: #adb5bd; }
            `}</style>

            <div className="header bg-gradient-primary pb-8 pt-5 pt-md-8">
                <Container fluid>
                    <div className="header-body">
                        {/* On peut garder un titre simple ici ou le retirer pour gagner de la place */}
                        <h2 className="text-white d-inline-block mb-0">Support PubCash</h2>
                    </div>
                </Container>
            </div>

            <Container className="mt--7" fluid>
                <Row className="justify-content-center">
                    <Col xl="12" className="messenger-container">
                        <Card className="card-messenger shadow">
                            <Row className="no-gutters h-100">
                                
                                {/* === COLONNE GAUCHE : LISTE DES CONVERSATIONS === */}
                                <Col md="4" lg="3" className={`chat-list-col ${selectedFeedback ? 'd-none d-md-flex' : 'd-flex'}`}>
                                    
                                    {/* Header Liste (Filtres) */}
                                    <div className="chat-list-header">
                                        <h4 className="mb-3 font-weight-bold text-gray">Boîte de réception</h4>
                                        <div className="nav-wrapper p-0">
                                            <div className="d-flex justify-content-between">
                                                <Badge 
                                                    color={filter === "all" ? "primary" : "secondary"}
                                                    className="cursor-pointer py-2 px-3 badge-pill"
                                                    onClick={() => { setFilter("all"); setSelectedFeedback(null); }}
                                                    style={{cursor: 'pointer'}}
                                                >
                                                    Tous
                                                </Badge>
                                                <Badge 
                                                    color={filter === "utilisateur" ? "warning" : "secondary"}
                                                    className="cursor-pointer py-2 px-3 badge-pill"
                                                    onClick={() => { setFilter("utilisateur"); setSelectedFeedback(null); }}
                                                    style={{cursor: 'pointer'}}
                                                >
                                                    Utilisateurs
                                                </Badge>
                                                <Badge 
                                                    color={filter === "client" ? "info" : "secondary"}
                                                    className="cursor-pointer py-2 px-3 badge-pill"
                                                    onClick={() => { setFilter("client"); setSelectedFeedback(null); }}
                                                    style={{cursor: 'pointer'}}
                                                >
                                                    Promoteurs
                                                </Badge>
                                            </div>
                                        </div>
                                    </div>

                                    {/* Liste Items */}
                                    <div className="chat-list-items">
                                        {isLoading ? (
                                            <div className="text-center p-5"><Spinner color="primary" /></div>
                                        ) : filteredFeedbacks.length === 0 ? (
                                            <div className="text-center p-5 text-muted">
                                                <i className="ni ni-chat-round fa-3x mb-3"></i>
                                                <p>Aucune conversation.</p>
                                            </div>
                                        ) : (
                                            filteredFeedbacks.map(feedback => (
                                                <div 
                                                    key={feedback.id}
                                                    className={`chat-item ${selectedFeedback?.id === feedback.id ? 'active' : ''}`}
                                                    onClick={() => setSelectedFeedback(feedback)}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        <div className={`avatar-circle ${getAvatarColor(feedback.user_type)}`}>
                                                            {getInitials(feedback.full_name)}
                                                        </div>
                                                        <div className="flex-grow-1" style={{minWidth: 0}}>
                                                            <div className="d-flex justify-content-between align-items-baseline mb-1">
                                                                <h5 className="mb-0 text-truncate font-weight-bold text-dark">
                                                                    {feedback.full_name || "Anonyme"}
                                                                </h5>
                                                                <small className="text-muted" style={{fontSize: '10px'}}>
                                                                    {feedback.created_at ? format(new Date(feedback.created_at), 'dd MMM', { locale: fr }) : ''}
                                                                </small>
                                                            </div>
                                                            <p className="mb-0 text-sm text-muted text-truncate">
                                                                {feedback.message}
                                                            </p>
                                                        </div>
                                                    </div>
                                                </div>
                                            ))
                                        )}
                                    </div>
                                </Col>

                                {/* === COLONNE DROITE : ZONE DE CHAT === */}
                                <Col md="8" lg="9" className={`chat-window-col ${selectedFeedback ? 'd-flex' : 'd-none d-md-flex'}`}>
                                    {selectedFeedback ? (
                                        <>
                                            {/* Chat Header */}
                                            <div className="chat-header">
                                                <div className="d-flex align-items-center">
                                                    <Button 
                                                        className="d-md-none mr-3 btn-icon-only rounded-circle" 
                                                        color="secondary" 
                                                        size="sm"
                                                        onClick={() => setSelectedFeedback(null)}
                                                    >
                                                        <i className="fas fa-arrow-left"></i>
                                                    </Button>
                                                    <div className={`avatar-circle ${getAvatarColor(selectedFeedback.user_type)}`} style={{width: '40px', height: '40px', fontSize: '16px'}}>
                                                        {getInitials(selectedFeedback.full_name)}
                                                    </div>
                                                    <div>
                                                        <h4 className="mb-0">{selectedFeedback.full_name}</h4>
                                                        <small className="text-muted">
                                                            {selectedFeedback.user_type === 'client' ? 'Promoteur' : 'Utilisateur'} • {selectedFeedback.email}
                                                        </small>
                                                    </div>
                                                </div>
                                                {selectedFeedback.phone && (
                                                    <a href={`tel:${selectedFeedback.phone}`} className="btn btn-sm btn-outline-success rounded-pill">
                                                        <i className="fas fa-phone mr-1"></i> {selectedFeedback.phone}
                                                    </a>
                                                )}
                                            </div>

                                            {/* Chat Body */}
                                            <div className="chat-body">
                                                {/* Message initial du ticket */}
                                                <div className="message-row">
                                                    <div className="message-bubble them">
                                                        <div>{selectedFeedback.message}</div>
                                                        <span className="message-time">
                                                            Ticket ouvert le {format(new Date(selectedFeedback.created_at), 'dd/MM à HH:mm')}
                                                        </span>
                                                    </div>
                                                </div>

                                                {/* Liste des messages */}
                                                {messages.map((msg, index) => {
                                                    const isMe = msg.sender_type === 'admin';
                                                    const fileUrl = msg.file_url ? getMediaUrl(msg.file_url) : null;
                                                    return (
                                                        <div key={index} className={`message-row ${isMe ? 'me' : ''}`}>
                                                            <div className={`message-bubble ${isMe ? 'me' : 'them'}`}>
                                                                {msg.message && <div>{msg.message}</div>}
                                                                
                                                                {fileUrl && (
                                                                    <div className="mt-2">
                                                                        {msg.file_type === 'image' ? (
                                                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer">
                                                                                <img src={fileUrl} alt="pj" className="img-fluid rounded shadow-sm" style={{maxWidth: '200px'}} />
                                                                            </a>
                                                                        ) : (
                                                                            <a href={fileUrl} target="_blank" rel="noopener noreferrer" className={isMe ? 'text-white' : 'text-primary'}>
                                                                                <i className="fas fa-paperclip mr-1"></i> Voir la pièce jointe
                                                                            </a>
                                                                        )}
                                                                    </div>
                                                                )}

                                                                <span className="message-time">
                                                                    {msg.created_at ? format(new Date(msg.created_at), 'HH:mm', { locale: fr }) : ''}
                                                                </span>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>

                                            {/* Chat Footer (Input) */}
                                            <div className="chat-footer">
                                                {adminFile && (
                                                    <div className="alert alert-secondary d-flex justify-content-between align-items-center py-2 px-3 mb-2 rounded-pill">
                                                        <small><i className="fas fa-file mr-2"></i>{adminFile.name}</small>
                                                        <button type="button" className="close" onClick={() => { setAdminFile(null); if (adminFileRef.current) adminFileRef.current.value = ''; }}>
                                                            <span aria-hidden="true">&times;</span>
                                                        </button>
                                                    </div>
                                                )}
                                                
                                                <div className="d-flex align-items-center">
                                                    <input 
                                                        type="file" 
                                                        ref={adminFileRef} 
                                                        className="d-none" 
                                                        onChange={(e) => setAdminFile(e.target.files[0])}
                                                    />
                                                    <Button 
                                                        color="secondary" 
                                                        className="rounded-circle mr-2 btn-icon-only" 
                                                        onClick={() => adminFileRef.current?.click()}
                                                        title="Joindre un fichier"
                                                    >
                                                        <i className="fas fa-paperclip"></i>
                                                    </Button>
                                                    
                                                    <Input 
                                                        className="chat-input mr-3"
                                                        placeholder="Écrivez votre réponse..."
                                                        value={newMessage}
                                                        onChange={(e) => setNewMessage(e.target.value)}
                                                        onKeyPress={(e) => e.key === 'Enter' && handleSendMessage()}
                                                        disabled={isSending}
                                                    />
                                                    
                                                    <Button 
                                                        color="primary" 
                                                        className="btn-send bg-gradient-primary border-0"
                                                        onClick={handleSendMessage}
                                                        disabled={isSending || (!newMessage.trim() && !adminFile)}
                                                    >
                                                        {isSending ? <Spinner size="sm" color="white" /> : <i className="fas fa-paper-plane text-white"></i>}
                                                    </Button>
                                                </div>
                                            </div>
                                        </>
                                    ) : (
                                        /* Empty State */
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100 bg-secondary">
                                            <div className="text-center">
                                                <div className="icon icon-shape bg-white text-primary rounded-circle shadow mb-4" style={{width: '80px', height: '80px'}}>
                                                    <i className="ni ni-chat-round fa-2x"></i>
                                                </div>
                                                <h3 className="text-muted">Sélectionnez une conversation</h3>
                                                <p className="text-muted mb-0">Pour voir les détails et répondre aux utilisateurs.</p>
                                            </div>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default AdminMessagerie;