import React, { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom"; // AJOUT: Pour la redirection
import {
    Card,
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
    UncontrolledTooltip,
    Spinner // AJOUT: Pour le chargement
} from "reactstrap";
import Picker from 'emoji-picker-react';
import api, { getMediaUrl } from "../../services/api";

const Messagerie = () => {
    const navigate = useNavigate(); // Hook de navigation

    // --- State ---
    const [conversations, setConversations] = useState([]);
    const [selectedContact, setSelectedContact] = useState(null);
    const [messages, setMessages] = useState([]);
    const [newMessage, setNewMessage] = useState("");
    const [sending, setSending] = useState(false);
    const [subscription, setSubscription] = useState(null);
    const [loadingSubscription, setLoadingSubscription] = useState(true); // État de chargement
    const [file, setFile] = useState(null);
    const [showEmojiPicker, setShowEmojiPicker] = useState(false);
    
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
                // On rafraichit les messages seulement si l'utilisateur est abonné
                // (Optionnel, mais économise des requêtes si bloqué)
                if(subscription?.hasSubscription) {
                    fetchMessages(selectedContact.contactId, selectedContact.contactType, false);
                }
            }
        }, 10000);
        return () => clearInterval(interval);
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [selectedContact, subscription?.hasSubscription]);

    // --- API Calls ---
    const checkSubscription = async () => {
        try {
            setLoadingSubscription(true);
            const res = await api.get("/subscriptions/status");
            setSubscription(res.data);
        } catch (error) { 
            console.error(error); 
        } finally {
            setLoadingSubscription(false);
        }
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
        setShowEmojiPicker(false);
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
            // Si l'erreur vient du backend (ex: 403 Forbidden car pas abonné)
            if(error.response && error.response.status === 403) {
                 alert("Abonnement requis pour envoyer des messages.");
            } else {
                 alert("Erreur lors de l'envoi.");
            }
        } finally {
            setSending(false);
        }
    };

    // --- Helpers ---
    const scrollToBottomFunc = () => messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

    const handleContactClick = (contact) => {
        setSelectedContact(contact);
        // On ne fetch les messages que si l'utilisateur est Premium, 
        // sinon on affichera le blocage.
        if(isPremium) {
            fetchMessages(contact.contactId, contact.contactType, true);
            markAsRead(contact.contactId, contact.contactType);
        }
    };

    const onEmojiClick = (emojiObject) => {
        setNewMessage(prevInput => prevInput + emojiObject.emoji);
    };

    const getAvatarSrc = (photoName) => {
        if (!photoName) return require("assets/img/theme/team-4-800x800.jpg");
        const str = String(photoName);
        return (str.startsWith('http')) ? str : getMediaUrl(`/uploads/profile/${str}`);
    };

    // Vérification sécurisée du statut premium
    const isPremium = subscription && subscription.hasSubscription;

    // --- Render ---
    return (
        <>
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
                                
                                {/* --- COLONNE GAUCHE : LISTE DES CONTACTS --- */}
                                {/* On laisse la liste visible pour créer l'envie (Teaser) */}
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
                                                        borderLeft: isActive ? '4px solid #f36c21' : '4px solid transparent', 
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
                                                            {/* On floute le dernier message si pas premium pour teaser */}
                                                            <small className={`text-muted text-truncate d-block ${!isPremium ? 'text-blur' : ''}`} style={{maxWidth: '180px', filter: !isPremium ? 'blur(3px)' : 'none'}}>
                                                                {conv.lastMessageType !== 'texte' ? <i className="ni ni-image text-muted mr-1"/> : null}
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

                                {/* --- COLONNE DROITE : ZONE DE CHAT OU PAYWALL --- */}
                                <Col md="8" lg="9" className="d-flex flex-column h-100 bg-secondary position-relative">
                                    
                                    {/* CAS 1: Chargement de l'abonnement */}
                                    {loadingSubscription ? (
                                        <div className="d-flex h-100 align-items-center justify-content-center">
                                            <Spinner color="primary" />
                                        </div>
                                    ) : !isPremium ? (
                                        // CAS 2: PAS ABONNÉ -> AFFICHER LE PAYWALL
                                        <div className="d-flex flex-column align-items-center justify-content-center h-100 text-center p-5" 
                                             style={{ background: 'linear-gradient(135deg, #ffffff 0%, #f4f5f7 100%)' }}>
                                            
                                            <div className="icon icon-shape bg-gradient-warning text-white rounded-circle shadow mb-4" style={{width: '90px', height: '90px'}}>
                                                <i className="ni ni-lock-circle-open" style={{fontSize: '3rem'}}></i>
                                            </div>
                                            
                                            <h2 className="display-4 mb-2">Messagerie Verrouillée</h2>
                                            <p className="lead text-muted mb-5" style={{maxWidth: '600px'}}>
                                                Pour discuter avec vos clients, répondre aux opportunités et développer votre réseau, 
                                                vous devez disposer d'un abonnement <strong>Promoteur Actif</strong>.
                                            </p>
                                            
                                            <Button 
                                                className="btn-pubcash btn-lg shadow-lg transform-on-hover" 
                                                style={{ padding: '15px 40px', fontSize: '1.2rem' }}
                                                onClick={() => navigate('/client/abonnement')}
                                            >
                                                <i className="ni ni-diamond mr-2"></i>
                                                S'abonner maintenant
                                            </Button>
                                            
                                            <p className="mt-4 text-sm text-muted">
                                                Déjà abonné ? <a href="#refresh" onClick={(e) => {e.preventDefault(); window.location.reload();}}>Actualiser la page</a>
                                            </p>
                                        </div>

                                    ) : selectedContact ? (
                                        // CAS 3: ABONNÉ ET CONTACT SÉLECTIONNÉ -> AFFICHER LE CHAT
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
                                                {/* Badge Premium discret */}
                                                <Badge color="success" className="text-uppercase ls-1">Premium</Badge>
                                            </div>

                                            {/* Messages */}
                                            <div 
                                                className="flex-grow-1 p-4 overflow-auto custom-scrollbar" 
                                                style={{ backgroundColor: '#DFF3DF' }}
                                            >
                                                {messages.map((msg) => {
                                                    const isMe = msg.type_expediteur === 'client'; 
                                                    return (
                                                        <div key={msg.id} className={`d-flex mb-3 ${isMe ? 'justify-content-end' : 'justify-content-start'}`}>
                                                            <div 
                                                                className={`p-3 shadow-sm position-relative ${isMe ? 'text-white' : 'bg-white text-dark'}`}
                                                                style={{ 
                                                                    backgroundColor: isMe ? '#f36c21' : '#fff',
                                                                    maxWidth: '75%', 
                                                                    borderRadius: isMe ? '18px 18px 0 18px' : '18px 18px 18px 0',
                                                                    minWidth: '100px'
                                                                }}
                                                            >
                                                                {msg.type_contenu === 'texte' && <p className="mb-0" style={{fontSize: '0.95rem'}}>{msg.contenu}</p>}
                                                                {msg.type_contenu === 'image' && <img src={getMediaUrl(msg.url_media)} alt="media" className="img-fluid rounded mb-2" />}
                                                                {msg.type_contenu === 'video' && <video src={getMediaUrl(msg.url_media)} controls className="img-fluid rounded mb-2" />}
                                                                
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
                                                                style={{ backgroundColor: '#f36c21' }}
                                                                type="submit" 
                                                                disabled={sending || (!newMessage.trim() && !file)}
                                                            >
                                                                <i className="ni ni-send"></i>
                                                            </Button>
                                                        </InputGroupAddon>
                                                    </InputGroup>
                                                </Form>
                                            </div>
                                        </>
                                    ) : (
                                        // CAS 4: ABONNÉ MAIS AUCUN CONTACT SÉLECTIONNÉ
                                        <div 
                                            className="d-flex flex-column align-items-center justify-content-center h-100 text-muted"
                                            style={{ backgroundColor: '#DFF3DF' }}
                                        >
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
                .text-blur { user-select: none; }
                .transform-on-hover:hover { transform: translateY(-2px); transition: transform 0.2s; }
            `}</style>
        </>
    );
};

export default Messagerie;