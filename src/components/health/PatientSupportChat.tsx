// @ts-nocheck
import React, { useState, useEffect } from "react";
import { PatientSupportMessage } from "@/entities/PatientSupportMessage";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Send, AlertCircle, Clock, CheckCircle } from "lucide-react";
import { format } from "date-fns";

export default function PatientSupportChat({ userId, onClose }) {
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [category, setCategory] = useState("medical");
  const [isUrgent, setIsUrgent] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadMessages();
  }, [userId]);

  const loadMessages = async () => {
    setIsLoading(true);
    try {
      const supportMessages = await PatientSupportMessage.filter(
        { user_id: userId },
        '-created_date',
        100
      );
      setMessages(supportMessages);

      // Mark unread messages as read
      for (const msg of supportMessages) {
        if (msg.sender_type === 'support' && !msg.is_read) {
          await PatientSupportMessage.update(msg.id, { is_read: true });
        }
      }
    } catch (error) {
      console.error("Error loading messages:", error);
    }
    setIsLoading(false);
  };

  const handleSend = async (e) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setIsSending(true);
    try {
      await PatientSupportMessage.create({
        user_id: userId,
        message_text: newMessage,
        sender_type: 'patient',
        category: category,
        is_urgent: isUrgent,
        is_read: false
      });

      setNewMessage("");
      setIsUrgent(false);
      loadMessages();

      // TODO: Integrate with your medical support chat system API
      // Example API call structure (uncomment and configure when ready):
      /*
      await fetch('https://your-support-system-api.com/messages', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          user_id: userId,
          message: newMessage,
          category: category,
          urgent: isUrgent,
          timestamp: new Date().toISOString()
        })
      });
      */
    } catch (error) {
      console.error("Error sending message:", error);
      alert("Error sending message. Please try again.");
    }
    setIsSending(false);
  };

  const categoryColors = {
    medical: 'bg-[#E31C25] text-white',
    billing: 'bg-black text-white',
    technical: 'bg-gray-700 text-white',
    general: 'bg-gray-600 text-white'
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#E31C25]"></div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(90vh-120px)]">
      {/* Info Banner */}
      <Card className="border-2 border-[#E31C25] bg-red-50 mb-4">
        <CardContent className="p-4">
          <div className="flex items-start gap-3">
            <AlertCircle className="w-5 h-5 text-[#E31C25] flex-shrink-0 mt-0.5" />
            <div>
              <p className="font-bold text-black text-sm">HIPAA-Protected Communication</p>
              <p className="text-xs text-gray-700 font-medium">
                This is a secure, HIPAA-compliant messaging system. Our patient support team typically responds within 1-2 hours during business hours. For medical emergencies, call 911.
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto bg-gray-50 rounded-sm p-4 space-y-4 mb-4 border-2 border-gray-100">
        {messages.length === 0 ? (
          <div className="text-center py-12">
            <p className="text-gray-600 font-semibold mb-2">No messages yet</p>
            <p className="text-sm text-gray-500">Start a conversation with our support team</p>
          </div>
        ) : (
          messages.map((msg) => {
            const isFromPatient = msg.sender_type === 'patient';
            return (
              <div
                key={msg.id}
                className={`flex ${isFromPatient ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`max-w-[70%]`}>
                  {!isFromPatient && (
                    <div className="flex items-center gap-2 mb-1">
                      <Badge className="bg-[#E31C25] text-white font-bold text-xs">
                        SUPPORT TEAM
                      </Badge>
                      {msg.support_agent_id && (
                        <span className="text-xs text-gray-500 font-semibold">
                          Agent {msg.support_agent_id}
                        </span>
                      )}
                    </div>
                  )}
                  <div
                    className={`p-4 rounded-lg ${
                      isFromPatient
                        ? 'bg-black text-white'
                        : 'bg-white border-2 border-gray-200 text-black'
                    }`}
                  >
                    {msg.category && (
                      <Badge className={`${categoryColors[msg.category]} text-xs font-bold mb-2`}>
                        {msg.category.toUpperCase()}
                      </Badge>
                    )}
                    {msg.is_urgent && (
                      <Badge className="bg-red-500 text-white text-xs font-bold mb-2 ml-2">
                        URGENT
                      </Badge>
                    )}
                    <p className="font-medium whitespace-pre-wrap">{msg.message_text}</p>
                  </div>
                  <div className={`flex items-center gap-2 mt-1 px-2 ${isFromPatient ? 'justify-end' : 'justify-start'}`}>
                    <span className="text-xs text-gray-500 font-semibold">
                      {format(new Date(msg.created_date), 'MMM d, h:mm a')}
                    </span>
                    {isFromPatient && (
                      msg.is_read ? (
                        <CheckCircle className="w-3 h-3 text-[#E31C25]" />
                      ) : (
                        <Clock className="w-3 h-3 text-gray-400" />
                      )
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* Message Input */}
      <form onSubmit={handleSend} className="space-y-3">
        <div className="flex gap-3">
          <Select value={category} onValueChange={setCategory}>
            <SelectTrigger className="w-40 border-2 border-gray-200 font-semibold">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="medical">Medical</SelectItem>
              <SelectItem value="billing">Billing</SelectItem>
              <SelectItem value="technical">Technical</SelectItem>
              <SelectItem value="general">General</SelectItem>
            </SelectContent>
          </Select>
          <label className="flex items-center gap-2 px-4 py-2 bg-gray-100 rounded-md cursor-pointer hover:bg-gray-200 transition-colors">
            <input
              type="checkbox"
              checked={isUrgent}
              onChange={(e) => setIsUrgent(e.target.checked)}
              className="w-4 h-4"
            />
            <span className="text-sm font-bold text-black uppercase">Mark as Urgent</span>
          </label>
        </div>
        
        <div className="flex gap-2">
          <Textarea
            value={newMessage}
            onChange={(e) => setNewMessage(e.target.value)}
            placeholder="Type your message to patient support..."
            className="flex-1 border-2 border-gray-200 focus:border-[#E31C25] font-semibold min-h-[80px]"
            disabled={isSending}
          />
          <Button
            type="submit"
            disabled={isSending || !newMessage.trim()}
            className="bg-[#E31C25] hover:bg-black text-white font-bold px-6 h-auto"
          >
            {isSending ? (
              <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white"></div>
            ) : (
              <>
                <Send className="w-5 h-5" />
              </>
            )}
          </Button>
        </div>
      </form>
    </div>
  );
}