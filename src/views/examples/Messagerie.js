import React, { useState, useEffect, useRef } from "react";
import {
    Card,
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
    UncontrolledTooltip
} from "reactstrap";
import Picker from 'emoji-picker-react'; // Import du picker d'emojis
import api, { getMediaUrl } from "../../services/api";

const Messagerie = () => {
    // --- State ---
    const [conversations, setConversations] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [file, setFile] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false); // State pour les emojis
    
    // --- Refs ---
    const messagesEndRef = useRef(null);
    const fileInputRef = useRef(null);

    // --- Effects ---
    useEffect(() => {
        checkSubscription();
        fetchConversations();
        const interval = setInterval(() => {
            fetchConversations();
            if (selectedContact) {
                fetchMessages(selectedContact.contactId, selectedContact.contactType, false);
            }
        }, 10000);
        return () => clearInterval(interval);
    }, [selectedContact]);

    // --- API Calls (Inchangés) ---
    const checkSubscription = async () => {
        try {
            const res = await api.get("/subscriptions/status");
            setSubscription(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchConversations = async () => {
        try {
            const res = await api.get("/messages/conversations");
            setConversations(res.data);
        } catch (error) { console.error(error); }
    };

    const fetchMessages = async (contactId, contactType, scrollToBottom = true) => {
        try {
            const res = await api.get(`/messages/${contactType}/${contactId}`);
            setMessages(res.data);
            if (scrollToBottom) setTimeout(scrollToBottomFunc, 100);
        } catch (error) { console.error(error); }
    };

    const markAsRead = async (contactId, contactType) => {
        try {
            await api.put(`/messages/${contactType}/${contactId}/read`);
            setConversations(prev => prev.map(c => c.contactId === contactId ? { ...c, unreadCount: 0 } : c));
        } catch (error) { console.error(error); }
    };

    const handleSendMessage = async (e) => {
        e.preventDefault();
        if ((!newMessage.trim() && !file) || !selectedContact) return;

        setSending(true);
        setShowEmojiPicker(false); // Fermer le picker après envoi
        try {
            const formData = new FormData();
            formData.append("destinataireId", selectedContact.contactId);
            formData.append("destinataireType", selectedContact.contactType);
            formData.append("contenu", newMessage);
            if (file) formData.append("media", file);

            await api.post("/messages/send", formData, { headers: { "Content-Type": "multipart/form-data" } });

            setNewMessage("");
            setFile(null);
            fetchMessages(selectedContact.contactId, selectedContact.contactType);
            fetchConversations(); 
        } catch (error) {
            alert("Erreur ou abonnement requis.");
        } finally {
            setSending(false);
        }
    };

    // --- Helpers ---
    const scrollToBottomFunc = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const handleContactClick = (contact) => {
        setSelectedContact(contact);
        fetchMessages(contact.contactId, contact.contactType, true);
        markAsRead(contact.contactId, contact.contactType);
        // Sur mobile, on pourrait ajouter une logique pour scroller vers la vue chat
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prevInput => prevInput + emojiObject.emoji);
    };

    const getAvatarSrc = (photoName) => {
        if (!photoName) return require("assets/img/theme/team-4-800x800.jpg");
        const str = String(photoName);
        return (str.startsWith('http')) ? str : getMediaUrl(`/uploads/profile/${str}`);
    };

    const isPremium = subscription && subscription.hasSubscription;

    // --- Render ---
    return (
        <>
            {/* Header plus compact */}
            <div className="header bg-gradient-info pb-6 pt-5 pt-md-8">
                <Container fluid>
                    <div className="header-body"></div>
                </Container>
            </div>

          <Container className="mt--6" fluid>
                <Row className="justify-content-center">
                    <Col xl="12">
                        <Card className="shadow overflow-hidden" style={{ borderRadius: '15px', height: '85vh', border: 'none' }}>
                            <Row className="h-100 no-gutters">
                                
                                {/* --- SIDEBAR CONTACTS --- */}
                                <Col md="4" lg="3" className="border-right bg-white h-100 d-flex flex-column">
                                    <div className="p-3 border-bottom bg-secondary">
                                        <h4 className="mb-0 text-uppercase text-muted ls-1" style={{fontSize: '0.8rem'}}>Vos échanges</h4>
                                    </div>
                                    <ListGroup flush className="flex-grow-1 overflow-auto custom-scrollbar">
                                        {conversations.map((conv) => {
                                            const isActive = selectedContact?.contactId === conv.contactId;
                                            return (
                                                <ListGroupItem
                                                    key={`${conv.contactType}_${conv.contactId}`}
                                                    action
                                                    onClick={() => handleContactClick(conv)}
                                                    className={`border-0 py-3 ${isActive ? 'bg-secondary' : ''}`}
                                                    style={{ 
                                                        cursor: 'pointer', 
                                                        borderLeft: isActive ? '4px solid #f36c21' : '4px solid transparent', // Bordure orange active
                                                        transition: 'all 0.2s ease'
                                                    }}
                                                >
                                                    <div className="d-flex align-items-center">
                                                        <div className="position-relative">
                                                            <span className="avatar avatar-sm rounded-circle shadow-sm">
                                                                <img 
                                                                    alt={conv.contactName} 
                                                                    src={getAvatarSrc(conv.contactPhoto)} 
                                                                    style={{ objectFit: 'cover', width:'100%', height:'100%'}}
                                                                    onError={(e) => { e.target.onerror = null; e.target.src = require("assets/img/theme/team-4-800x800.jpg"); }}
                                                                />
                                                            </span>
                                                            {conv.unreadCount > 0 && (
                                                                <span className="position-absolute badge badge-circle badge-success border-white border" 
                                                                      style={{top: -5, right: -5, width: '18px', height:'18px', fontSize:'10px'}}>
                                                                    {conv.unreadCount}
                                                                </span>
                                                            )}
                                                        </div>
                                                        <div className="ml-3 text-truncate">
                                                            <h5 className={`mb-0 ${isActive ? 'font-weight-bold' : 'text-dark'}`} style={{ color: isActive ? '#f36c21' : '' }}>
                                                                {conv.contactName}
                                                            </h5>
                                                            <small className="text-muted text-truncate d-block" style={{maxWidth: '180px'}}>
                                                                {conv.lastMessageType !== 'texte' ? 
                                                                    <i className="ni ni-image text-muted mr-1"/> : null}
                                                                {conv.lastMessage}
                                                            </small>
                                                        </div>
                                                    </div>
                                                </ListGroupItem>
                                            );
                                        })}
                                        {conversations.length === 0 && (
                                            <div className="text-center p-5 text-muted">
                                                <i className="ni ni-chat-round display-4 mb-3"></i><br/>
                                                Aucune conversation
                                            </div>
                                        )}
                                    </ListGroup>
                                </Col>

                                {/* --- ZONE DE CHAT --- */}
                                <Col md="8" lg="9" className="d-flex flex-column h-100 bg-secondary">
                                    {selectedContact ? (
                                        <>
                                            {/* Header du Chat */}
                                            <div className="p-3 bg-white border-bottom shadow-sm d-flex align-items-center justify-content-between z-index-1">
                                                <div className="d-flex align-items-center">
                                                    <div className="avatar avatar-sm rounded-circle mr-3">
                                                        <img 
                                                            alt="" 
                                                            src={getAvatarSrc(selectedContact.contactPhoto)} 
                                                            style={{objectFit: 'cover', width:'100%', height:'100%'}}
                                                            onError={(e) => { e.target.onerror = null; e.target.src = require("assets/img/theme/team-4-800x800.jpg"); }}
                                                        />
                                                    </div>
                                                    <div>
                                                        <h4 className="mb-0 text-dark">{selectedContact.contactName}</h4>
                                                        <small className="text-muted">En ligne</small>
                                                    </div>
                                                </div>
                                                {!isPremium && <Badge color="warning">Mode Gratuit</Badge>}
                                            </div>

                                            {/* Messages */}
                                            <div className="flex-grow-1 p-4 overflow-auto custom-scrollbar" style={{ backgroundColor: '#f4f5f7' }}>
                                                {messages.map((msg) => {
                                                    const isMe = msg.type_expediteur === 'client'; 
                                                    return (
                                                        <div key={msg.id} className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                                            <div 
                                                                className={`p-3 shadow-sm position-relative ${isMe ? 'text-white' : 'bg-white text-dark'}`}
                                                                style={{ 
                                                                    // MODIFICATION ICI : Background Orange pour moi
                                                                    backgroundColor: isMe ? '#f36c21' : '#fff',
                                                                    maxWidth: '75%', 
                                                                    borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0',
                                                                    minWidth: '100px'
                                                                }}
                                                            >
                                                                {msg.type_contenu === 'texte' && <p className="mb-0" style={{fontSize: '0.95rem'}}>{msg.contenu}</p>}
                                                                {msg.type_contenu === 'image' && <img src={getMediaUrl(msg.url_media)} alt="media" className="img-fluid rounded mb-2" />}
                                                                {msg.type_contenu === 'video' && <video src={getMediaUrl(msg.url_media)} controls className="img-fluid rounded mb-2" />}
                                                                
                                                                {/* Date et statut de lecture en blanc pur pour être visible sur le orange */}
                                                                <div className={`text-right mt-1 ${isMe ? 'text-white' : 'text-muted'}`} style={{ fontSize: '0.65em', opacity: isMe ? 0.8 : 1 }}>
                                                                    {new Date(msg.date_envoi).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                                    {isMe && <i className={`ni ni-check-bold ml-1 ${msg.lu ? 'text-white' : ''}`}></i>}
                                                                </div>
                                                            </div>
                                                        </div>
                                                    );
                                                })}
                                                <div ref={messagesEndRef} />
                                            </div>

                                            {/* Zone de saisie */}
                                            <div className="p-3 bg-white border-top">
                                                {isPremium ? (
                                                    <Form onSubmit={handleSendMessage} className="position-relative">
                                                        
                                                        {file && (
                                                            <div className="mb-2 p-2 bg-secondary rounded d-inline-block position-relative">
                                                                <span className="text-sm mr-2"><i className="ni ni-cloud-upload-96 mr-1"/>{file.name}</span>
                                                                <button type="button" className="close float-none" onClick={() => setFile(null)}>&times;</button>
                                                            </div>
                                                        )}

                                                        {showEmojiPicker && (
                                                            <div className="position-absolute" style={{ bottom: '60px', left: '0', zIndex: 10 }}>
                                                                <Picker onEmojiClick={onEmojiClick} height={350} width={300} />
                                                            </div>
                                                        )}

                                                        <InputGroup className="input-group-alternative shadow-sm rounded-pill" style={{border: '1px solid #e9ecef'}}>
                                                            <InputGroupAddon addonType="prepend">
                                                                <Button 
                                                                    className="btn-icon rounded-circle ml-1 my-1" 
                                                                    color="secondary" 
                                                                    type="button"
                                                                    onClick={() => setShowEmojiPicker(!showEmojiPicker)}
                                                                >
                                                                    <i className="ni ni-satisfied text-warning" style={{fontSize: '1.2rem'}}></i>
                                                                </Button>
                                                            </InputGroupAddon>

                                                            <InputGroupAddon addonType="prepend">
                                                                <Button 
                                                                    className="btn-icon rounded-circle my-1 mr-2" 
                                                                    color="secondary" 
                                                                    onClick={() => fileInputRef.current.click()}
                                                                    id="tooltipFile"
                                                                >
                                                                    <i className="ni ni-paper-diploma text-info" style={{fontSize: '1.1rem'}}></i>
                                                                </Button>
                                                                <UncontrolledTooltip target="tooltipFile">Joindre un fichier</UncontrolledTooltip>
                                                                <input
                                                                    type="file"
                                                                    ref={fileInputRef}
                                                                    style={{ display: 'none' }}
                                                                    onChange={(e) => setFile(e.target.files[0])}
                                                                    accept="image/*,video/*"
                                                                />
                                                            </InputGroupAddon>

                                                            <Input
                                                                placeholder="Écrivez votre message..."
                                                                value={newMessage}
                                                                onChange={(e) => setNewMessage(e.target.value)}
                                                                disabled={sending}
                                                                className="border-0 pl-2"
                                                                onFocus={() => setShowEmojiPicker(false)}
                                                            />
                                                            
                                                            <InputGroupAddon addonType="append">
                                                                <Button 
                                                                    className="btn-icon rounded-circle mr-1 my-1 text-white border-0" 
                                                                    // MODIFICATION ICI : Bouton envoi orange aussi
                                                                    style={{ backgroundColor: '#f36c21' }}
                                                                    type="submit" 
                                                                    disabled={sending || (!newMessage.trim() && !file)}
                                                                >
                                                                    <i className="ni ni-send"></i>
                                                                </Button>
                                                            </InputGroupAddon>
                                                        </InputGroup>
                                                    </Form>
                                                ) : (
                                                    <div className="alert alert-warning mb-0 text-center shadow-sm">
                                                        <i className="ni ni-lock-circle-open mr-2"></i>
                                                        <strong>Premium requis</strong> : Abonnez-vous pour débloquer la réponse.
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-muted bg-white">
                                            <div className="icon icon-shape bg-gradient-light text-primary rounded-circle shadow mb-4">
                                                <i className="ni ni-send" style={{fontSize: '2rem'}}></i>
                                            </div>
                                            <h3>Vos Messages</h3>
                                            <p>Sélectionnez une conversation pour commencer à discuter.</p>
                                        </div>
                                    )}
                                </Col>
                            </Row>
                        </Card>
                    </Col>
                </Row>
            </Container>

            <style>{`
                .custom-scrollbar::-webkit-scrollbar { width: 6px; }
                .custom-scrollbar::-webkit-scrollbar-track { background: #f1f1f1; }
                .custom-scrollbar::-webkit-scrollbar-thumb { background: #ccc; border-radius: 4px; }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover { background: #bbb; }
            `}</style>
        </>
    );
};

export default Messagerie;