import React, { useState, useEffect, useRef } from "react";
import {
  Drawer,
  Box,
  Typography,
  TextField,
  IconButton,
  Paper,
  List,
  ListItem,
  Avatar,
  Divider,
  CircularProgress,
  Alert,
} from "@mui/material";
import SendIcon from "@mui/icons-material/Send";
import CloseIcon from "@mui/icons-material/Close";
import AttachFileIcon from "@mui/icons-material/AttachFile";
import { format, parseISO } from "date-fns";
import { useAuth } from "../auth/AuthContext";

export default function ChatPanel({
  open,
  onClose,
  consumerId,
  consumerName,
  chatId: providedChatId,
}) {
  const { token, user } = useAuth();
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [chatId, setChatId] = useState(providedChatId);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [ws, setWs] = useState(null);
  const messagesEndRef = useRef(null);
  const messagesContainerRef = useRef(null);

  // Scroll to bottom when messages change
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages]);

  // Find or create chat when panel opens
  useEffect(() => {
    if (open && consumerId && token && !chatId) {
      findOrCreateChat();
    }
  }, [open, consumerId, token, chatId]);

  // Load messages when chatId is available
  useEffect(() => {
    if (open && chatId && token) {
      loadMessages();
      connectWebSocket();
    }

    return () => {
      if (ws) {
        ws.close();
      }
    };
  }, [chatId, open]);

  const findOrCreateChat = async () => {
    if (!token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);
    setError("");

    try {
      // Get all chats for the current user (sales only)
      // This endpoint requires check_sales, so only sales users can access it
      const response = await fetch(`${base}/sales/chats`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });
      
      if (response.status === 403) {
        setError("Only sales users can access chat functionality.");
        setLoading(false);
        return;
      }

      if (response.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }

      if (response.ok) {
        const chats = await response.json();
        // Find chat with matching consumer_id
        const existingChat = Array.isArray(chats)
          ? chats.find((chat) => chat.consumer_id === consumerId)
          : null;

        if (existingChat) {
          setChatId(existingChat.chat_id);
        } else {
          // Chat doesn't exist yet - it will be created when link request is approved
          // For now, show a message
          setError("Chat will be available after the consumer's link request is approved.");
        }
      }
    } catch (err) {
      setError("Failed to load chat");
      console.error("Error finding chat:", err);
    } finally {
      setLoading(false);
    }
  };

  const loadMessages = async () => {
    if (!token || !chatId) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    setLoading(true);

    try {
      const response = await fetch(`${base}/chat/messages/${chatId}`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.status === 401) {
        setError("Session expired. Please log in again.");
        return;
      }

      if (response.ok) {
        const data = await response.json();
        setMessages(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      setError("Failed to load messages");
      console.error("Error loading messages:", err);
    } finally {
      setLoading(false);
    }
  };

  const connectWebSocket = () => {
    if (!chatId) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";
    const wsUrl = base.replace("http://", "ws://").replace("https://", "wss://");
    const websocket = new WebSocket(`${wsUrl}/ws/${chatId}`);

    websocket.onopen = () => {
      console.log("WebSocket connected");
      setError("");
    };

    websocket.onmessage = (event) => {
      try {
        const message = JSON.parse(event.data);
        // Add new message to the list
        setMessages((prev) => [...prev, message]);
      } catch (err) {
        console.error("Error parsing WebSocket message:", err);
      }
    };

    websocket.onerror = (error) => {
      console.error("WebSocket error:", error);
      setError("Connection error. Please refresh.");
    };

    websocket.onclose = () => {
      console.log("WebSocket disconnected");
      // Attempt to reconnect after a delay
      setTimeout(() => {
        if (open && chatId) {
          connectWebSocket();
        }
      }, 3000);
    };

    setWs(websocket);
  };

  const handleSendMessage = async () => {
    if (!newMessage.trim() || !ws || !chatId || !token) return;

    const base = import.meta.env.VITE_API_URL || "http://localhost:8000";

    try {
      // Send message via WebSocket
      const messageData = {
        sender_id: user?.user_id,
        content: newMessage.trim(),
        file_url: null,
        file_type: null,
      };

      if (ws.readyState === WebSocket.OPEN) {
        ws.send(JSON.stringify(messageData));
        setNewMessage("");
      } else {
        setError("Connection lost. Please refresh.");
      }
    } catch (err) {
      setError("Failed to send message");
      console.error("Error sending message:", err);
    }
  };

  const handleKeyPress = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const isMyMessage = (message) => {
    return message.sender_id === user?.user_id;
  };

  return (
    <Drawer
      anchor="right"
      open={open}
      onClose={onClose}
      PaperProps={{
        sx: {
          width: { xs: "100%", sm: 450 },
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      {/* Header */}
      <Box
        sx={{
          p: 2,
          borderBottom: 1,
          borderColor: "divider",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Box>
          <Typography variant="h6" sx={{ fontWeight: 600 }}>
            {consumerName || "Chat"}
          </Typography>
          <Typography variant="caption" color="text.secondary">
            {chatId ? "Online" : "Chat not available"}
          </Typography>
        </Box>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="error" sx={{ m: 2 }} onClose={() => setError("")}>
          {error}
        </Alert>
      )}

      {/* Messages Area */}
      <Box
        ref={messagesContainerRef}
        sx={{
          flex: 1,
          overflowY: "auto",
          p: 2,
          bgcolor: "#f8fafc",
        }}
      >
        {loading && messages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <CircularProgress />
          </Box>
        ) : messages.length === 0 ? (
          <Box
            sx={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              height: "100%",
            }}
          >
            <Typography variant="body2" color="text.secondary">
              No messages yet. Start the conversation!
            </Typography>
          </Box>
        ) : (
          <List sx={{ p: 0 }}>
            {messages.map((message, idx) => {
              const isMine = isMyMessage(message);
              const showDate =
                idx === 0 ||
                format(
                  parseISO(message.timestamp || new Date().toISOString()),
                  "yyyy-MM-dd"
                ) !==
                  format(
                    parseISO(
                      messages[idx - 1]?.timestamp || new Date().toISOString()
                    ),
                    "yyyy-MM-dd"
                  );

              return (
                <React.Fragment key={message.chatmessages_id || idx}>
                  {showDate && (
                    <Box
                      sx={{
                        textAlign: "center",
                        my: 2,
                      }}
                    >
                      <Typography variant="caption" color="text.secondary">
                        {format(
                          parseISO(message.timestamp || new Date().toISOString()),
                          "MMM dd, yyyy"
                        )}
                      </Typography>
                    </Box>
                  )}
                  <ListItem
                    sx={{
                      justifyContent: isMine ? "flex-end" : "flex-start",
                      px: 0,
                      py: 0.5,
                    }}
                  >
                    <Box
                      sx={{
                        display: "flex",
                        flexDirection: isMine ? "row-reverse" : "row",
                        alignItems: "flex-end",
                        gap: 1,
                        maxWidth: "75%",
                      }}
                    >
                      <Avatar
                        sx={{
                          width: 32,
                          height: 32,
                          bgcolor: isMine ? "primary.main" : "grey.400",
                        }}
                      >
                        {isMine
                          ? user?.first_name?.[0] || "U"
                          : consumerName?.[0] || "C"}
                      </Avatar>
                      <Paper
                        elevation={1}
                        sx={{
                          p: 1.5,
                          borderRadius: 2,
                          bgcolor: isMine ? "primary.main" : "white",
                          color: isMine ? "white" : "text.primary",
                        }}
                      >
                        <Typography variant="body2">{message.content}</Typography>
                        <Typography
                          variant="caption"
                          sx={{
                            display: "block",
                            mt: 0.5,
                            opacity: 0.7,
                            fontSize: "0.7rem",
                          }}
                        >
                          {format(
                            parseISO(message.timestamp || new Date().toISOString()),
                            "HH:mm"
                          )}
                        </Typography>
                      </Paper>
                    </Box>
                  </ListItem>
                </React.Fragment>
              );
            })}
            <div ref={messagesEndRef} />
          </List>
        )}
      </Box>

      {/* Input Area */}
      {chatId && (
        <Box
          sx={{
            p: 2,
            borderTop: 1,
            borderColor: "divider",
            bgcolor: "white",
          }}
        >
          <Box sx={{ display: "flex", gap: 1, alignItems: "flex-end" }}>
            <IconButton size="small" disabled>
              <AttachFileIcon fontSize="small" />
            </IconButton>
            <TextField
              multiline
              maxRows={4}
              placeholder="Type a message..."
              value={newMessage}
              onChange={(e) => setNewMessage(e.target.value)}
              onKeyPress={handleKeyPress}
              disabled={!ws || ws.readyState !== WebSocket.OPEN}
              fullWidth
              size="small"
              sx={{
                "& .MuiOutlinedInput-root": {
                  borderRadius: 2,
                },
              }}
            />
            <IconButton
              color="primary"
              onClick={handleSendMessage}
              disabled={
                !newMessage.trim() ||
                !ws ||
                ws.readyState !== WebSocket.OPEN
              }
            >
              <SendIcon />
            </IconButton>
          </Box>
        </Box>
      )}
    </Drawer>
  );
}

