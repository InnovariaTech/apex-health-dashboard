import React, { useState, useEffect, useCallback } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, Users, CheckCheck, Clock } from "lucide-react";
import { format } from "date-fns";

export default function AdminChat() {
  const [currentUser, setCurrentUser] = useState(null);
  const [clients, setClients] = useState([]);
  const [selectedClient, setSelectedClient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);

  const loadData = useCallback(async () => {
    setIsLoading(true);
    const user = await api.auth.me();
    setCurrentUser(user);
    const allUsers = await api.entities.User.list();
    const clientList = allUsers.filter(u => u.role !== "admin");
    const allMessages = await api.entities.Message.list();
    const clientsWithUnread = clientList.map(client => ({
      ...client,
      unreadCount: allMessages.filter(m => m.from_user_id === client.email && m.to_user_id === user.email && !m.is_read).length
    }));
    setClients(clientsWithUnread);
    setIsLoading(false);
  }, []);

  const loadMessages = useCallback(async () => {
    if (!currentUser || !selectedClient) return;
    const allMessages = await api.entities.Message.list("-created_date");
    const conversation = allMessages.filter(m =>
      (m.from_user_id === currentUser.email && m.to_user_id === selectedClient.email) ||
      (m.from_user_id === selectedClient.email && m.to_user_id === currentUser.email)
    ).reverse();
    setMessages(conversation);
    for (const msg of conversation) {
      if (msg.to_user_id === currentUser.email && !msg.is_read) {
        await api.entities.Message.update(msg.id, { is_read: true });
      }
    }
    loadData();
  }, [currentUser, selectedClient, loadData]);

  useEffect(() => { loadData(); }, [loadData]);
  useEffect(() => { if (selectedClient) loadMessages(); }, [selectedClient, loadMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedClient) return;
    setIsSending(true);
    const threadId = [currentUser.email, selectedClient.email].sort().join("-");
    await api.entities.Message.create({
      from_user_id: currentUser.email,
      to_user_id: selectedClient.email,
      message_text: newMessage,
      thread_id: threadId,
      is_read: false
    });
    setNewMessage("");
    loadMessages();
    setIsSending(false);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-full bg-background">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  return (
    <div className="h-screen flex bg-background">
      {/* Client List Sidebar */}
      <div className="w-80 border-r-2 border-border flex flex-col bg-muted/30">
        <div className="p-4 border-b-2 border-border bg-sidebar">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-primary rounded-sm flex items-center justify-center">
              <Users className="w-6 h-6 text-primary-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-sidebar-foreground">CLIENTS</h2>
              <p className="text-xs text-sidebar-foreground/60 font-semibold">{clients.length} total</p>
            </div>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-2">
          {clients.length === 0 ? (
            <div className="text-center py-8">
              <Users className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
              <p className="text-sm text-muted-foreground font-semibold">No clients yet</p>
            </div>
          ) : (
            clients.map((client) => (
              <button
                key={client.email}
                onClick={() => setSelectedClient(client)}
                className={`w-full p-3 rounded-sm text-left transition-all ${
                  selectedClient?.email === client.email
                    ? 'bg-primary text-primary-foreground'
                    : 'bg-card hover:bg-muted border-2 border-border text-foreground'
                }`}
              >
                <div className="flex items-center gap-3">
                  <Avatar className="w-10 h-10 border-2 border-border">
                    <AvatarFallback className={`font-bold ${selectedClient?.email === client.email ? 'bg-primary-foreground text-primary' : 'bg-primary text-primary-foreground'}`}>
                      {client.full_name?.[0]?.toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex-1 min-w-0">
                    <p className="font-bold truncate">{client.full_name}</p>
                    <p className={`text-xs truncate ${selectedClient?.email === client.email ? 'opacity-70' : 'text-muted-foreground'}`}>
                      {client.email}
                    </p>
                  </div>
                  {client.unreadCount > 0 && (
                    <Badge className="bg-primary text-primary-foreground border-none font-bold">{client.unreadCount}</Badge>
                  )}
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {/* Chat Area */}
      <div className="flex-1 flex flex-col">
        {!selectedClient ? (
          <div className="flex-1 flex items-center justify-center">
            <div className="text-center">
              <MessageSquare className="w-16 h-16 text-muted-foreground/30 mx-auto mb-4" />
              <h3 className="text-xl font-bold text-foreground mb-2">No Client Selected</h3>
              <p className="text-muted-foreground">Select a client from the sidebar to start messaging</p>
            </div>
          </div>
        ) : (
          <>
            <div className="border-b-2 border-border p-4 bg-sidebar">
              <div className="flex items-center gap-3">
                <Avatar className="w-12 h-12 border-2 border-primary">
                  <AvatarFallback className="bg-primary text-primary-foreground font-bold text-lg">
                    {selectedClient.full_name?.[0]?.toUpperCase()}
                  </AvatarFallback>
                </Avatar>
                <div>
                  <h2 className="text-xl font-bold text-sidebar-foreground">{selectedClient.full_name}</h2>
                  <p className="text-sm text-sidebar-foreground/60 font-semibold">{selectedClient.email}</p>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4 bg-muted/20">
              {messages.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <div className="text-center">
                    <MessageSquare className="w-12 h-12 text-muted-foreground/30 mx-auto mb-3" />
                    <p className="text-muted-foreground font-semibold">No messages yet</p>
                    <p className="text-sm text-muted-foreground">Start the conversation!</p>
                  </div>
                </div>
              ) : (
                messages.map((msg) => {
                  const isFromMe = msg.from_user_id === currentUser.email;
                  return (
                    <div key={msg.id} className={`flex ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                      <div className="max-w-[70%]">
                        <div className={`p-4 rounded-lg ${isFromMe ? 'bg-foreground text-background' : 'bg-card border-2 border-border text-foreground'}`}>
                          <p className="font-medium whitespace-pre-wrap">{msg.message_text}</p>
                        </div>
                        <div className={`flex items-center gap-2 mt-1 px-2 ${isFromMe ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-muted-foreground font-semibold">
                            {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                          </span>
                          {isFromMe && (msg.is_read ? <CheckCheck className="w-3 h-3 text-primary" /> : <Clock className="w-3 h-3 text-muted-foreground" />)}
                        </div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>

            <div className="border-t-2 border-border p-4 bg-card">
              <form onSubmit={handleSendMessage} className="flex gap-2">
                <Input
                  value={newMessage}
                  onChange={(e) => setNewMessage(e.target.value)}
                  placeholder="Type your message..."
                  className="flex-1 border-2 border-border focus:border-primary font-semibold"
                  disabled={isSending}
                />
                <Button type="submit" disabled={isSending || !newMessage.trim()} className="bg-primary hover:bg-primary/80 text-primary-foreground font-bold px-6">
                  {isSending ? <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-primary-foreground"></div> : <><Send className="w-5 h-5 mr-2" />SEND</>}
                </Button>
              </form>
            </div>
          </>
        )}
      </div>
    </div>
  );
}