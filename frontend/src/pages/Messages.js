// src/pages/Messages.js
import React, { useState, useEffect, useRef } from 'react';
import { Helmet } from 'react-helmet';
import messagesService from '../services/messages';
import { authService } from '../services/auth';

const Messages = () => {
  const [conversations, setConversations] = useState([]);
  const [selectedConversation, setSelectedConversation] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [attachment, setAttachment] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [showNewChat, setShowNewChat] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  
  const messagesEndRef = useRef(null);
  const currentUser = authService.getCurrentUser();

  useEffect(() => {
    fetchConversations();
  }, []);

  useEffect(() => {
    if (selectedConversation) {
      fetchMessages(selectedConversation.id);
      markConversationAsRead(selectedConversation.id);
    }
  }, [selectedConversation]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  // Normalize data helper
  const normalizeArrayData = (data) => {
    if (!data) return [];
    if (Array.isArray(data)) return data;
    if (data.results) return data.results;
    if (data.data) return data.data;
    if (typeof data === 'object') {
      const values = Object.values(data);
      if (values.length > 0 && values.some(v => typeof v === 'object')) {
        return values;
      }
    }
    return [];
  };

  const fetchConversations = async () => {
    try {
      setLoading(true);
      const data = await messagesService.getConversations();
      const conversationsData = normalizeArrayData(data);
      
      setConversations(conversationsData);
      
      // Update badge count
      const unreadCount = conversationsData.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      localStorage.setItem('messageCount', unreadCount);
      window.dispatchEvent(new CustomEvent('messageCountUpdate', { detail: unreadCount }));
      
      if (conversationsData.length > 0 && !selectedConversation) {
        setSelectedConversation(conversationsData[0]);
      }
    } catch (err) {
      console.error('Error fetching conversations:', err);
      setConversations([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchMessages = async (conversationId) => {
    try {
      const data = await messagesService.getMessages(conversationId);
      const messagesData = normalizeArrayData(data);
      setMessages(messagesData);
    } catch (err) {
      console.error('Error fetching messages:', err);
      setMessages([]);
    }
  };

  const markConversationAsRead = async (conversationId) => {
    try {
      await messagesService.markConversationRead(conversationId);
      const updatedConversations = conversations.map(conv => 
        conv.id === conversationId ? { ...conv, unread_count: 0 } : conv
      );
      setConversations(updatedConversations);
      
      const totalUnread = updatedConversations.reduce((sum, conv) => sum + (conv.unread_count || 0), 0);
      localStorage.setItem('messageCount', totalUnread);
      window.dispatchEvent(new CustomEvent('messageCountUpdate', { detail: totalUnread }));
    } catch (err) {
      console.error('Error marking conversation as read:', err);
    }
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() && !attachment) return;
    
    setSending(true);
    try {
      const response = await messagesService.sendMessage(
        selectedConversation.id,
        newMessage,
        attachment
      );
      setMessages([...messages, response]);
      setNewMessage('');
      setAttachment(null);
      
      // Update conversation list with latest message
      const updatedConversations = conversations.map(conv => 
        conv.id === selectedConversation.id 
          ? { ...conv, last_message: response.content, last_message_time: response.created_at }
          : conv
      );
      setConversations(updatedConversations);
    } catch (err) {
      console.error('Error sending message:', err);
      alert('Failed to send message. Please try again.');
    } finally {
      setSending(false);
    }
  };

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (file && file.size <= 10 * 1024 * 1024) {
      setAttachment(file);
    } else {
      alert('File size must be less than 10MB');
    }
  };

  const handleSearchUsers = async (query) => {
    setSearchTerm(query);
    if (query.length < 2) {
      setSearchResults([]);
      return;
    }
    
    setSearching(true);
    try {
      const results = await messagesService.searchUsers(query);
      const resultsData = normalizeArrayData(results);
      setSearchResults(resultsData);
    } catch (err) {
      console.error('Error searching users:', err);
      setSearchResults([]);
    } finally {
      setSearching(false);
    }
  };

  const startNewConversation = async (user) => {
    try {
      const conversation = await messagesService.startConversation(user.id);
      const updatedConversations = [conversation, ...conversations];
      setConversations(updatedConversations);
      setSelectedConversation(conversation);
      setShowNewChat(false);
      setSearchTerm('');
      setSearchResults([]);
    } catch (err) {
      console.error('Error starting conversation:', err);
      alert('Failed to start conversation. Please try again.');
    }
  };

  const getInitials = (name) => {
    return name ? name.charAt(0).toUpperCase() : '?';
  };

  const getTimeDisplay = (date) => {
    if (!date) return '';
    const msgDate = new Date(date);
    const now = new Date();
    const diffDays = Math.floor((now - msgDate) / (1000 * 60 * 60 * 24));
    
    if (diffDays === 0) {
      return msgDate.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffDays === 1) {
      return 'Yesterday';
    } else if (diffDays < 7) {
      return msgDate.toLocaleDateString([], { weekday: 'short' });
    } else {
      return msgDate.toLocaleDateString();
    }
  };

  const formatFileSize = (bytes) => {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  };

  const getUserDisplayName = (participant) => {
    if (!participant) return 'User';
    return participant.full_name || participant.username || 'User';
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg p-8">
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Helmet>
        <title>Messages | EHR System</title>
        <meta name="description" content="Send and receive secure messages with healthcare providers and patients." />
      </Helmet>

      <div className="min-h-screen bg-gray-50 py-8">
        <div className="max-w-6xl mx-auto px-4">
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden border border-gray-200">
            <div className="flex h-[calc(100vh-8rem)]">
              {/* Conversations Sidebar */}
              <div className="w-80 border-r border-gray-200 flex flex-col">
                <div className="p-4 border-b border-gray-200">
                  <div className="flex justify-between items-center mb-4">
                    <h2 className="text-xl font-bold text-gray-900">Messages</h2>
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 transition-colors"
                      title="New Message"
                    >
                      <i className="fas fa-plus"></i>
                    </button>
                  </div>
                  <div className="relative">
                    <i className="fas fa-search absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 text-sm"></i>
                    <input
                      type="text"
                      placeholder="Search conversations..."
                      value={searchTerm}
                      onChange={(e) => handleSearchUsers(e.target.value)}
                      className="w-full pl-9 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
                    />
                  </div>
                </div>
                <div className="flex-1 overflow-y-auto">
                  {!Array.isArray(conversations) || conversations.length === 0 ? (
                    <div className="p-8 text-center">
                      <i className="fas fa-comments text-4xl text-gray-300 mb-3"></i>
                      <p className="text-gray-500">No conversations yet</p>
                      <button
                        onClick={() => setShowNewChat(true)}
                        className="mt-3 text-blue-600 hover:text-blue-700 text-sm"
                      >
                        Start a new conversation
                      </button>
                    </div>
                  ) : (
                    conversations.map(conv => {
                      const participant = conv.other_participant || conv.participant;
                      return (
                        <button
                          key={conv.id}
                          onClick={() => setSelectedConversation(conv)}
                          className={`w-full p-4 text-left hover:bg-gray-50 transition-colors border-b border-gray-100 ${
                            selectedConversation?.id === conv.id ? 'bg-blue-50' : ''
                          }`}
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                              {getInitials(participant?.full_name || participant?.username)}
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="flex justify-between items-start">
                                <p className="font-semibold text-gray-900 truncate">
                                  {getUserDisplayName(participant)}
                                </p>
                                {conv.last_message_time && (
                                  <span className="text-xs text-gray-400">
                                    {getTimeDisplay(conv.last_message_time)}
                                  </span>
                                )}
                              </div>
                              <p className="text-sm text-gray-500 truncate">
                                {conv.last_message || 'No messages yet'}
                              </p>
                            </div>
                          </div>
                          {conv.unread_count > 0 && (
                            <div className="ml-12 mt-1">
                              <span className="bg-red-500 text-white text-xs px-2 py-0.5 rounded-full animate-pulse">
                                {conv.unread_count}
                              </span>
                            </div>
                          )}
                        </button>
                      );
                    })
                  )}
                </div>
              </div>

              {/* Chat Area */}
              {selectedConversation ? (
                <div className="flex-1 flex flex-col">
                  {/* Chat Header */}
                  <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                        {getInitials(selectedConversation.other_participant?.full_name || selectedConversation.other_participant?.username)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">
                          {getUserDisplayName(selectedConversation.other_participant)}
                        </h3>
                        <p className="text-xs text-gray-500 capitalize">
                          {selectedConversation.other_participant?.user_type || 'User'}
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Messages Area */}
                  <div className="flex-1 overflow-y-auto p-4 space-y-4">
                    {Array.isArray(messages) && messages.map((message, index) => (
                      <div
                        key={message.id || index}
                        className={`flex ${message.sender_id === currentUser?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-[70%] rounded-2xl px-4 py-2 ${
                            message.sender_id === currentUser?.id
                              ? 'bg-blue-600 text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <p className="text-sm break-words whitespace-pre-wrap">{message.content}</p>
                          {message.attachment && (
                            <a
                              href={message.attachment.url}
                              target="_blank"
                              rel="noopener noreferrer"
                              className={`inline-flex items-center gap-1 mt-1 text-xs ${
                                message.sender_id === currentUser?.id
                                  ? 'text-blue-200 hover:text-white'
                                  : 'text-blue-600 hover:text-blue-700'
                              }`}
                            >
                              <i className="fas fa-paperclip"></i>
                              {message.attachment.name || 'Attachment'}
                              {message.attachment.size && (
                                <span className="text-xs opacity-75">
                                  ({formatFileSize(message.attachment.size)})
                                </span>
                              )}
                            </a>
                          )}
                          <div
                            className={`text-xs mt-1 ${
                              message.sender_id === currentUser?.id
                                ? 'text-blue-200'
                                : 'text-gray-400'
                            }`}
                          >
                            {getTimeDisplay(message.created_at)}
                            {message.is_read && message.sender_id === currentUser?.id && (
                              <i className="fas fa-check-double ml-1"></i>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                    <div ref={messagesEndRef} />
                  </div>

                  {/* Message Input */}
                  <form onSubmit={handleSendMessage} className="p-4 border-t border-gray-200">
                    <div className="flex items-end gap-2">
                      <div className="flex-1">
                        <textarea
                          value={newMessage}
                          onChange={(e) => setNewMessage(e.target.value)}
                          placeholder="Type a message..."
                          rows="2"
                          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 resize-none"
                          onKeyDown={(e) => {
                            if (e.key === 'Enter' && !e.shiftKey) {
                              e.preventDefault();
                              handleSendMessage(e);
                            }
                          }}
                        />
                      </div>
                      <div className="flex gap-2">
                        <label className="cursor-pointer p-2 text-gray-500 hover:text-blue-600 hover:bg-blue-50 rounded-lg transition-colors relative">
                          <i className="fas fa-paperclip"></i>
                          <input
                            type="file"
                            className="hidden"
                            onChange={handleFileChange}
                            accept="image/*,.pdf,.doc,.docx,.txt"
                          />
                        </label>
                        <button
                          type="submit"
                          disabled={sending || (!newMessage.trim() && !attachment)}
                          className="bg-blue-600 text-white p-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                        >
                          {sending ? (
                            <i className="fas fa-spinner fa-spin"></i>
                          ) : (
                            <i className="fas fa-paper-plane"></i>
                          )}
                        </button>
                      </div>
                    </div>
                    {attachment && (
                      <div className="mt-2 text-sm text-gray-600 flex items-center gap-2 bg-gray-50 p-2 rounded-lg">
                        <i className="fas fa-file text-blue-500"></i>
                        <span className="flex-1 truncate">{attachment.name}</span>
                        <span className="text-xs text-gray-400">{formatFileSize(attachment.size)}</span>
                        <button
                          type="button"
                          onClick={() => setAttachment(null)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <i className="fas fa-times"></i>
                        </button>
                      </div>
                    )}
                  </form>
                </div>
              ) : (
                <div className="flex-1 flex items-center justify-center">
                  <div className="text-center">
                    <i className="fas fa-comments text-5xl text-gray-300 mb-4"></i>
                    <p className="text-gray-500">Select a conversation to start messaging</p>
                    <button
                      onClick={() => setShowNewChat(true)}
                      className="mt-3 text-blue-600 hover:text-blue-700"
                    >
                      Start a new conversation
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* New Chat Modal */}
      {showNewChat && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-2xl shadow-xl max-w-md w-full">
            <div className="p-6 border-b border-gray-200">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-bold text-gray-900">New Message</h3>
                <button
                  onClick={() => {
                    setShowNewChat(false);
                    setSearchTerm('');
                    setSearchResults([]);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <i className="fas fa-times"></i>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search for users
                </label>
                <input
                  type="text"
                  placeholder="Enter name or email..."
                  value={searchTerm}
                  onChange={(e) => handleSearchUsers(e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  autoFocus
                />
              </div>
              <div className="max-h-64 overflow-y-auto">
                {searching ? (
                  <div className="flex justify-center py-8">
                    <i className="fas fa-spinner fa-spin text-gray-400 text-2xl"></i>
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="space-y-2">
                    {searchResults.map(user => (
                      <button
                        key={user.id}
                        onClick={() => startNewConversation(user)}
                        className="w-full flex items-center space-x-3 p-3 hover:bg-gray-50 rounded-lg transition-colors"
                      >
                        <div className="w-10 h-10 rounded-full bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-center text-white font-semibold">
                          {getInitials(user.full_name || user.username)}
                        </div>
                        <div className="flex-1 text-left">
                          <p className="font-medium text-gray-900">{user.full_name || user.username}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchTerm.length >= 2 ? (
                  <p className="text-sm text-gray-500 text-center py-8">
                    No users found matching "{searchTerm}"
                  </p>
                ) : (
                  <p className="text-sm text-gray-500 text-center py-8">
                    Enter at least 2 characters to search
                  </p>
                )}
              </div>
            </div>
            <div className="p-6 border-t border-gray-200 flex justify-end">
              <button
                onClick={() => {
                  setShowNewChat(false);
                  setSearchTerm('');
                  setSearchResults([]);
                }}
                className="px-4 py-2 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default Messages;