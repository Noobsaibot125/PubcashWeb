import React, { useState, useEffect, useRef } from "react";
import {
    Card,
    CardHeader,
    CardBody,
    Container,
    Row,
    Col,
    Input,
    Button,
    ListGroup,
    ListGroupItem,
    Badge,
    Form,
    InputGroup,
    InputGroupAddon,
    Spinner
} from "reactstrap";
// import Header from "components/Headers/Header.js"; 
import api, { getMediaUrl } from "../../services/api";

const Messagerie = () => {
    // --- State ---
    const [conversations, setConversations] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [loading, setLoading] = useState(true);
    const [sending, setSending] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [file, setFile] = useState(null);
    
    // --- Refs ---
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- Effects ---
    useEffect(() => {
        checkSubscription();
        fetchConversations();

        // Rafraîchir toutes les 10 secondes
        const interval = setInterval(() => {
            fetchConversations();
            if (selectedContact) {
                fetchMessages(selectedContact.contactId, selectedContact.contactType, false);
            }
        }, 10000);

        return () => clearInterval(interval);
    }, [selectedContact]);

    // --- API Calls ---
    const checkSubscription = async () => {
        try {
            const res = await api.get("/subscriptions/status");
            setSubscription(res.data);
        } catch (error) {
            console.error("Erreur checkSubscription:", error);
        }
    };

    const fetchConversations = async () => {
        try {
            const res = await api.get("/messages/conversations");
            setConversations(res.data);
            setLoading(false);
        } catch (error) {
            console.error("Erreur fetchConversations:", error);
            setLoading(false);
        }
    };

    const fetchMessages = async (contactId, contactType, scrollToBottom = true) => {
        try {
            const res = await api.get(`/messages/${contactType}/${contactId}`);
            setMessages(res.data);
            if (scrollToBottom) {
                scrollToBottomFunc();
            }
        } catch (error) {
            console.error("Erreur fetchMessages:", error);
        }
    };

    const markAsRead = async (contactId, contactType) => {
        try {
            await api.put(`/messages/${contactType}/${contactId}/read`);
            setConversations(prev => prev.map(c =>
                c.contactId === contactId ? { ...c, unreadCount: 0 } : c
            ));
        } catch (error) {
            console.error("Erreur markAsRead:", error);
        }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !file) || !selectedContact) return;

        setSending(true);
        try {
            const formData = new FormData();
            formData.append("destinataireId", selectedContact.contactId);
            formData.append("destinataireType", selectedContact.contactType);
            formData.append("contenu", newMessage);
            if (file) {
                formData.append("media", file);
            }

            await api.post("/messages/send", formData, {
                headers: { "Content-Type": "multipart/form-data" }
            });

            setNewMessage("");
            setFile(null);
            fetchMessages(selectedContact.contactId, selectedContact.contactType);
            fetchConversations(); 
        } catch (error) {
            console.error("Erreur sendMessage:", error);
            alert("Erreur lors de l'envoi. Vérifiez votre abonnement.");
        } finally {
            setSending(false);
        }
    };

    // --- Helpers & Handlers ---
    const scrollToBottomFunc = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    const handleContactClick = (contact) => {
        setSelectedContact(contact);
        fetchMessages(contact.contactId, contact.contactType);
        markAsRead(contact.contactId, contact.contactType);
    };

    const handleFileChange = (e) => {
        setFile(e.target.files[0]);
    };

    /**
     * Gère l'affichage de l'avatar de manière sécurisée.
     * Gère : NULL, URL Google/FB (http...), Fichier local, et évite le crash 'startsWith'.
     */
    const getAvatarSrc = (photoName) => {
        // 1. Si vide, image par défaut
        if (!photoName) {
            return require("assets/img/theme/team-4-800x800.jpg");
        }
        
        // 2. Sécurité : Force la conversion en chaîne de caractères
        const strPhotoName = String(photoName);

        // 3. Si c'est une URL externe (Google / Facebook)
        if (strPhotoName.startsWith('http') || strPhotoName.startsWith('https')) {
            return strPhotoName;
        }
        
        // 4. Sinon c'est un fichier local dans notre dossier uploads
        return getMediaUrl(`/uploads/profile/${strPhotoName}`);
    };

    const isPremium = subscription && subscription.hasSubscription;

    // --- Render ---
    return (
        <>
            <div className="header bg-gradient-info pb-8 pt-5 pt-md-8">
                <Container fluid>
                    <div className="header-body"></div>
                </Container>
            </div>
            <Container className="mt--7" fluid>
                <Row>
                    <Col className="mb-5 mb-xl-0" xl="12">
                        <Card className="shadow" style={{ height: '80vh' }}>
                            <CardHeader className="border-0">
                                <Row className="align-items-center">
                                    <div className="col">
                                        <h3 className="mb-0">Messagerie</h3>
                                    </div>
                                    {!isPremium && (
                                        <div className="col text-right">
                                            <Button color="warning" href="/client/abonnement" size="sm">
                                                Passer Premium pour répondre
                                            </Button>
                                        </div>
                                    )}
                                </Row>
                            </CardHeader>
                            <CardBody className="p-0">
                                <Row className="h-100 no-gutters">
                                    
                                    {/* COLONNE GAUCHE : LISTE CONTACTS */}
                                    <Col md="4" className="border-right h-100 overflow-auto" style={{ maxHeight: '70vh' }}>
                                        <ListGroup flush>
                                            {conversations.map((conv) => (
                                                <ListGroupItem
                                                    key={`${conv.contactType}_${conv.contactId}`}
                                                    action
                                                    active={selectedContact?.contactId === conv.contactId}
                                                    onClick={() => handleContactClick(conv)}
                                                    style={{ cursor: 'pointer' }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        <div className="avatar avatar-sm rounded-circle mr-3">
                                                            <img
                                                                alt={conv.contactName}
                                                                src={getAvatarSrc(conv.contactPhoto)}
                                                                style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                                onError={(e) => {
                                                                    // Fallback si l'image ne charge pas (404)
                                                                    e.target.onerror = null; 
                                                                    e.target.src = require("assets/img/theme/team-4-800x800.jpg");
                                                                }}
                                                            />
                                                        </div>
                                                        <div className="flex-grow-1 overflow-hidden">
                                                            <h5 className="mb-0 text-truncate">{conv.contactName}</h5>
                                                            <small className="text-muted text-truncate d-block">
                                                                {conv.lastMessageType !== 'texte' ? `[${conv.lastMessageType}]` : conv.lastMessage}
                                                            </small>
                                                        </div>
                                                        {conv.unreadCount > 0 && (
                                                            <Badge color="success" pill>{conv.unreadCount}</Badge>
                                                        )}
                                                    </div>
                                                </ListGroupItem>
                                            ))}
                                            {conversations.length === 0 && (
                                                <div className="text-center p-4 text-muted">
                                                    Aucune conversation
                                                </div>
                                            )}
                                        </ListGroup>
                                    </Col>

                                    {/* COLONNE DROITE : CHAT */}
                                    <Col md="8" className="d-flex flex-column h-100" style={{ maxHeight: '70vh' }}>
                                        {selectedContact ? (
                                            <>
                                                {/* Header Chat */}
                                                <div className="p-3 border-bottom bg-secondary d-flex align-items-center">
                                                    <div className="avatar avatar-sm rounded-circle mr-2">
                                                        <img 
                                                            alt="" 
                                                            src={getAvatarSrc(selectedContact.contactPhoto)} 
                                                            style={{ objectFit: 'cover', width: '100%', height: '100%' }}
                                                            onError={(e) => {
                                                                e.target.onerror = null; 
                                                                e.target.src = require("assets/img/theme/team-4-800x800.jpg");
                                                            }}
                                                        />
                                                    </div>
                                                    <h4 className="mb-0">{selectedContact.contactName}</h4>
                                                </div>

                                                {/* Messages Area */}
                                                <div className="flex-grow-1 p-3 overflow-auto" style={{ backgroundColor: '#f8f9fe' }}>
                                                    {messages.map((msg) => {
                                                        const isMe = msg.type_expediteur === 'client'; 
                                                        return (
                                                            <div key={msg.id} className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                                                <div
                                                                    className={`p-3 rounded shadow-sm ${isMe ? 'bg-primary text-white' : 'bg-white'}`}
                                                                    style={{ maxWidth: '70%', borderRadius: '15px' }}
                                                                >
                                                                    {msg.type_contenu === 'texte' && <p className="mb-0">{msg.contenu}</p>}
                                                                    {msg.type_contenu === 'image' && (
                                                                        <img src={getMediaUrl(msg.url_media)} alt="media" className="img-fluid rounded" />
                                                                    )}
                                                                    {msg.type_contenu === 'video' && (
                                                                        <video src={getMediaUrl(msg.url_media)} controls className="img-fluid rounded" />
                                                                    )}
                                                                    <small className={`d-block mt-1 ${isMe ? 'text-light' : 'text-muted'}`} style={{ fontSize: '0.7em' }}>
                                                                        {new Date(msg.date_envoi).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                        {isMe && (msg.lu ? ' • Lu' : ' • Envoyé')}
                                                                    </small>
                                                                </div>
                                                            </div>
                                                        );
                                                    })}
                                                    <div ref={messagesEndRef} />
                                                </div>

                                                {/* Input Zone */}
                                                <div className="p-3 border-top bg-white">
                                                    {isPremium ? (
                                                        <Form onSubmit={handleSendMessage}>
                                                            <InputGroup>
                                                                <InputGroupAddon addonType="prepend">
                                                                    <Button color="secondary" onClick={() => fileInputRef.current.click()}>
                                                                        <i className="ni ni-image"></i>
                                                                    </Button>
                                                                    <input
                                                                        type="file"
                                                                        ref={fileInputRef}
                                                                        style={{ display: 'none' }}
                                                                        onChange={handleFileChange}
                                                                        accept="image/*,video/*,application/pdf"
                                                                    />
                                                                </InputGroupAddon>
                                                                <Input
                                                                    placeholder={file ? `Fichier sélectionné: ${file.name}` : "Écrivez votre message..."}
                                                                    value={newMessage}
                                                                    onChange={(e) => setNewMessage(e.target.value)}
                                                                    disabled={sending}
                                                                />
                                                                <InputGroupAddon addonType="append">
                                                                    <Button color="primary" type="submit" disabled={sending || (!newMessage.trim() && !file)}>
                                                                        <i className="ni ni-send"></i>
                                                                    </Button>
                                                                </InputGroupAddon>
                                                            </InputGroup>
                                                        </Form>
                                                    ) : (
                                                        <div className="text-center text-muted">
                                                            <i className="ni ni-lock-circle-open mr-2"></i>
                                                            Abonnez-vous pour répondre à ce message.
                                                        </div>
                                                    )}
                                                </div>
                                            </>
                                        ) : (
                                            <div className="d-flex align-items-center justify-content-center h-100 text-muted">
                                                Sélectionnez une conversation pour commencer
                                            </div>
                                        )}
                                    </Col>
                                </Row>
                            </CardBody>
                        </Card>
                    </Col>
                </Row>
            </Container>
        </>
    );
};

export default Messagerie;