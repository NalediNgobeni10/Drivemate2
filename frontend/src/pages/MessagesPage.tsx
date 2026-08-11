import React, { useEffect, useState } from 'react';
import { MessageCircle, Send, AlertCircle, Loader, ArrowLeft } from 'lucide-react';
import { useAuth } from '../context/AuthContext';
import { messagesAPI } from '../lib/api';
import type { Message, MessageThread } from '../types';

const MessagesPage: React.FC = () => {
  const { user } = useAuth();
  const [threads, setThreads] = useState<MessageThread[]>([]);
  const [selectedThread, setSelectedThread] = useState<MessageThread | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const fetchThreads = async () => {
      try {
        const res = await messagesAPI.getThreads();
        setThreads(res.data);
      } catch (err: any) {
        setError(err.response?.data?.error || 'Failed to load messages');
      } finally {
        setLoading(false);
      }
    };
    fetchThreads();
  }, []);

  const loadMessages = async (thread: MessageThread) => {
    setSelectedThread(thread);
    try {
      const res = await messagesAPI.getWith(thread.peerId);
      setMessages(res.data);
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to load messages');
    }
  };

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedThread) return;

    setSending(true);
    try {
      const res = await messagesAPI.send(selectedThread.peerId, newMessage);
      setMessages([...messages, res.data]);
      setNewMessage('');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Loader className="animate-spin text-emerald-500" size={32} />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 to-slate-800 py-8">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <Link
            to="/dashboard"
            className="inline-flex items-center gap-2 text-slate-400 hover:text-emerald-400 transition mb-4"
          >
            <ArrowLeft size={18} />
            <span>Back to Dashboard</span>
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">
            Messages
          </h1>
          <p className="text-slate-400">Communicate with instructors and students</p>
        </div>

        {error && (
          <div className="mb-6 p-4 bg-red-500/10 border border-red-500/50 rounded-lg flex items-center gap-2">
            <AlertCircle size={20} className="text-red-400" />
            <p className="text-red-400">{error}</p>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Threads List */}
          <div className="bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            <h2 className="text-lg font-bold text-white mb-4">Conversations</h2>
            
            {threads.length === 0 ? (
              <div className="text-center py-8">
                <MessageCircle size={32} className="mx-auto text-slate-600 mb-2" />
                <p className="text-slate-400 text-sm">No conversations yet</p>
              </div>
            ) : (
              <div className="space-y-2">
                {threads.map((thread) => (
                  <button
                    key={thread.peerId}
                    onClick={() => loadMessages(thread)}
                    className={`w-full text-left p-3 rounded-lg transition ${
                      selectedThread?.peerId === thread.peerId
                        ? 'bg-emerald-500/20 border border-emerald-500/50'
                        : 'bg-slate-700/30 hover:bg-slate-700/50 border border-transparent'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-1">
                      <p className="text-white font-medium">{thread.peer.name}</p>
                      {thread.unreadCount > 0 && (
                        <span className="px-2 py-0.5 bg-emerald-500 text-white text-xs rounded-full">
                          {thread.unreadCount}
                        </span>
                      )}
                    </div>
                    <p className="text-slate-400 text-sm truncate">{thread.lastMessage}</p>
                    <p className="text-slate-500 text-xs mt-1">
                      {new Date(thread.lastAt).toLocaleDateString()}
                    </p>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Message View */}
          <div className="lg:col-span-2 bg-slate-800/50 border border-slate-700 rounded-lg p-6">
            {!selectedThread ? (
              <div className="flex flex-col items-center justify-center h-96">
                <MessageCircle size={48} className="text-slate-600 mb-4" />
                <p className="text-slate-400">Select a conversation to start messaging</p>
              </div>
            ) : (
              <>
                <div className="flex items-center gap-3 mb-6 pb-4 border-b border-slate-700">
                  <button
                    onClick={() => setSelectedThread(null)}
                    className="p-2 hover:bg-slate-700 rounded-lg transition lg:hidden"
                  >
                    <ArrowLeft size={20} className="text-slate-400" />
                  </button>
                  <div className="w-10 h-10 bg-gradient-to-br from-emerald-400 to-emerald-600 rounded-full flex items-center justify-center">
                    <span className="text-white font-bold">{selectedThread.peer.name.charAt(0)}</span>
                  </div>
                  <div>
                    <p className="text-white font-semibold">{selectedThread.peer.name}</p>
                    <p className="text-emerald-400 text-sm">{selectedThread.peer.role}</p>
                  </div>
                </div>

                <div className="h-96 overflow-y-auto mb-4 space-y-3">
                  {messages.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-slate-400">No messages yet. Start the conversation!</p>
                    </div>
                  ) : (
                    messages.map((msg) => (
                      <div
                        key={msg.id}
                        className={`flex ${msg.senderId === user?.id ? 'justify-end' : 'justify-start'}`}
                      >
                        <div
                          className={`max-w-xs lg:max-w-md px-4 py-2 rounded-lg ${
                            msg.senderId === user?.id
                              ? 'bg-emerald-500 text-white'
                              : 'bg-slate-700 text-white'
                          }`}
                        >
                          <p>{msg.content}</p>
                          <p className={`text-xs mt-1 ${msg.senderId === user?.id ? 'text-emerald-100' : 'text-slate-400'}`}>
                            {new Date(msg.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </p>
                        </div>
                      </div>
                    ))
                  )}
                </div>

                <form onSubmit={handleSendMessage} className="flex gap-2">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type a message..."
                    className="flex-1 px-4 py-2 bg-slate-700 border border-slate-600 rounded-lg text-white placeholder-slate-400 focus:outline-none focus:border-emerald-500"
                  />
                  <button
                    type="submit"
                    disabled={sending || !newMessage.trim()}
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-600 disabled:bg-slate-600 disabled:cursor-not-allowed text-white rounded-lg transition flex items-center gap-2"
                  >
                    {sending ? (
                      <Loader size={18} className="animate-spin" />
                    ) : (
                      <Send size={18} />
                    )}
                    Send
                  </button>
                </form>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default MessagesPage;
