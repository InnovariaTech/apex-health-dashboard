import React, { useState, useEffect, useCallback, useRef } from "react";
import { api } from "@/api/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import { Badge } from "@/components/ui/badge";
import { MessageSquare, Send, CheckCheck, Clock, Stethoscope, HeartHandshake } from "lucide-react";
import { format } from "date-fns";
import { useEnvironment } from "@/lib/EnvironmentContext";

const THREAD_TYPES = [
  {
    id: "provider",
    label: "My Provider",
    sub: "Message your doctor or care team",
    icon: Stethoscope,
    color: "#2563eb",
    role: "admin",
    placeholder: "Message your provider...",
    badge: "Medical",
    badgeColor: "bg-blue-100 text-blue-700",
  },
  {
    id: "support",
    label: "Patient Support",
    sub: "Billing, scheduling, and general help",
    icon: HeartHandshake,
    color: "#7c3aed",
    role: "admin",
    placeholder: "Message patient support...",
    badge: "Support",
    badgeColor: "bg-purple-100 text-purple-700",
  },
];

export default function Chat() {
  const { environment } = useEnvironment();
  const [currentUser, setCurrentUser] = useState(null);
  const [adminUsers, setAdminUsers] = useState([]);
  const [activeThread, setActiveThread] = useState("provider");
  const [selectedRecipient, setSelectedRecipient] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [isLoading, setIsLoading] = useState(true);
  const [isSending, setIsSending] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => { loadData(); }, []);
  useEffect(() => { if (selectedRecipient) loadMessages(); }, [selectedRecipient]);
  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [messages]);

  const loadData = async () => {
    setIsLoading(true);
    const user = await api.auth.me();
    setCurrentUser(user);
    const allUsers = await api.entities.User.list();
    const admins = allUsers.filter(u => u.role === "admin");
    setAdminUsers(admins);
    if (admins.length > 0) setSelectedRecipient(admins[0]);
    setIsLoading(false);
  };

  const loadMessages = useCallback(async () => {
    if (!currentUser || !selectedRecipient) return;
    const allMessages = await api.entities.Message.list("-created_date");
    const threadId = [currentUser.email, selectedRecipient.email, activeThread].sort().join("-");
    const conversation = allMessages
      .filter(m => m.thread_id === threadId)
      .reverse();
    setMessages(conversation);
    for (const msg of conversation) {
      if (msg.to_user_id === currentUser.email && !msg.is_read) {
        await api.entities.Message.update(msg.id, { is_read: true });
      }
    }
  }, [currentUser, selectedRecipient, activeThread]);

  useEffect(() => { if (selectedRecipient) loadMessages(); }, [activeThread, loadMessages]);

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedRecipient) return;
    setIsSending(true);
    const threadId = [currentUser.email, selectedRecipient.email, activeThread].sort().join("-");
    await api.entities.Message.create({
      from_user_id: currentUser.email,
      to_user_id: selectedRecipient.email,
      message_text: newMessage,
      thread_id: threadId,
      is_read: false,
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

  const currentThreadConfig = THREAD_TYPES.find(t => t.id === activeThread);

  return (
    <div className="flex flex-col h-[calc(100vh-64px)] bg-background">
      {/* Header */}
      <div className="border-b px-6 py-4 bg-card flex-shrink-0">
        <div className="flex items-center gap-3 mb-4">
          <div className="w-10 h-10 rounded-lg flex items-center justify-center" style={{ backgroundColor: environment.primaryColor }}>
            <MessageSquare className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-foreground">Care Team Messages</h1>
            <p className="text-xs text-muted-foreground font-medium">Secure messaging with your medical team</p>
          </div>
        </div>

        {/* Thread type selector */}
        <div className="flex gap-2">
          {THREAD_TYPES.map(thread => (
            <button
              key={thread.id}
              onClick={() => setActiveThread(thread.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg border-2 text-sm font-bold transition-all ${
                activeThread === thread.id
                  ? "border-current text-white"
                  : "border-border text-muted-foreground hover:border-muted-foreground bg-background"
              }`}
              style={activeThread === thread.id ? { backgroundColor: thread.color, borderColor: thread.color } : {}}
            >
              <thread.icon className="w-4 h-4" />
              {thread.label}
            </button>
          ))}
        </div>
      </div>

      {/* Chat area */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Recipient bar */}
        {selectedRecipient && (
          <div className="border-b px-6 py-3 bg-muted/30 flex items-center gap-3 flex-shrink-0">
            <Avatar className="w-9 h-9 border-2" style={{ borderColor: currentThreadConfig.color }}>
              <AvatarFallback className="text-white text-sm font-bold" style={{ backgroundColor: currentThreadConfig.color }}>
                {selectedRecipient.full_name?.[0]?.toUpperCase() || "D"}
              </AvatarFallback>
            </Avatar>
            <div className="flex-1">
              <p className="text-sm font-bold text-foreground">{selectedRecipient.full_name || "Care Team"}</p>
              <p className="text-xs text-muted-foreground">{currentThreadConfig.sub}</p>
            </div>
            <Badge className={`text-xs font-bold border-none ${currentThreadConfig.badgeColor}`}>
              {currentThreadConfig.badge}
            </Badge>
          </div>
        )}

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4 bg-muted/10">
          {messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-center py-12">
              <div className="w-16 h-16 rounded-2xl flex items-center justify-center mb-4" style={{ backgroundColor: currentThreadConfig.color + "18" }}>
                <currentThreadConfig.icon className="w-8 h-8" style={{ color: currentThreadConfig.color }} />
              </div>
              <h3 className="font-bold text-foreground mb-1">Start a conversation</h3>
              <p className="text-sm text-muted-foreground max-w-xs">{currentThreadConfig.sub}. Messages are reviewed during business hours.</p>
            </div>
          ) : (
            messages.map((msg) => {
              const isFromMe = msg.from_user_id === currentUser.email;
              return (
                <div key={msg.id} className={`flex ${isFromMe ? "justify-end" : "justify-start"}`}>
                  {!isFromMe && (
                    <Avatar className="w-7 h-7 mr-2 mt-1 flex-shrink-0 border" style={{ borderColor: currentThreadConfig.color }}>
                      <AvatarFallback className="text-white text-xs font-bold" style={{ backgroundColor: currentThreadConfig.color }}>
                        {selectedRecipient?.full_name?.[0]?.toUpperCase() || "D"}
                      </AvatarFallback>
                    </Avatar>
                  )}
                  <div className="max-w-[72%]">
                    <div className={`px-4 py-3 rounded-2xl text-sm font-medium ${
                      isFromMe
                        ? "text-white rounded-br-sm"
                        : "bg-card border border-border text-foreground rounded-bl-sm"
                    }`}
                    style={isFromMe ? { backgroundColor: currentThreadConfig.color } : {}}
                    >
                      <p className="whitespace-pre-wrap">{msg.message_text}</p>
                    </div>
                    <div className={`flex items-center gap-1.5 mt-1 px-1 ${isFromMe ? "justify-end" : "justify-start"}`}>
                      <span className="text-[10px] text-muted-foreground font-medium">
                        {format(new Date(msg.created_date), "MMM d, h:mm a")}
                      </span>
                      {isFromMe && (msg.is_read
                        ? <CheckCheck className="w-3 h-3" style={{ color: currentThreadConfig.color }} />
                        : <Clock className="w-3 h-3 text-muted-foreground" />
                      )}
                    </div>
                  </div>
                </div>
              );
            })
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Disclaimer + Input */}
        <div className="border-t px-4 py-3 bg-card flex-shrink-0">
          <p className="text-[10px] text-muted-foreground font-medium mb-2 text-center">
            ⚠️ For medical emergencies, call 911. This is not a crisis line.
          </p>
          {!selectedRecipient ? (
            <p className="text-center text-sm text-muted-foreground font-semibold py-2">No care team members available.</p>
          ) : (
            <form onSubmit={handleSendMessage} className="flex gap-2">
              <Input
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={currentThreadConfig.placeholder}
                className="flex-1 border-2 focus:border-primary font-medium"
                disabled={isSending}
              />
              <Button
                type="submit"
                disabled={isSending || !newMessage.trim()}
                className="px-5 font-bold text-white"
                style={{ backgroundColor: currentThreadConfig.color }}
              >
                {isSending
                  ? <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white" />
                  : <Send className="w-4 h-4" />
                }
              </Button>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}