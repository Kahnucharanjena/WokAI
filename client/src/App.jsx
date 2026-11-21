import { useState, useRef, useEffect } from "react";
import ReactMarkdown from "react-markdown";
import "./App.css";

const API_URL =
  import.meta.env.VITE_API_URL ||
  "http://127.0.0.1:5000/api/chat";

const WEBSITE_URL =
  "https://the-wok-restaurants.onrender.com/";

const initialMessages = [
  {
    role: "assistant",
    text: "Hello! 👋 Welcome to The Wok – Chinese Kitchen. I'm WokAI, your restaurant assistant. How can I help you today?",
  },
];

function App() {
  const isEmbed =
    new URLSearchParams(window.location.search).get("embed") === "1";

  const [messages, setMessages] = useState(initialMessages);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);

  const chatAreaRef = useRef(null);
  const inputRef = useRef(null);

  // Automatically scroll to latest message
  useEffect(() => {
    const chatArea = chatAreaRef.current;

    if (chatArea) {
      chatArea.scrollTo({
        top: chatArea.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages, loading]);

  // Send message to Flask backend
  const sendMessage = async (customMessage) => {
    const message = (customMessage ?? input).trim();

    if (!message || loading) return;

    setMessages((prev) => [
      ...prev,
      {
        role: "user",
        text: message,
      },
    ]);

    setInput("");
    setLoading(true);

    try {
      const response = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          message: message,
        }),
      });

      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }

      const data = await response.json();

      const botReply =
        data.reply ??
        data.response ??
        data.answer ??
        data.message ??
        "Sorry, I couldn't process that request.";

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            typeof botReply === "string"
              ? botReply
              : JSON.stringify(botReply),
        },
      ]);
    } catch (error) {
      console.error("WokAI API Error:", error);

      setMessages((prev) => [
        ...prev,
        {
          role: "assistant",
          text:
            "I'm sorry! I'm having trouble connecting to the server. Please check whether the backend is running and try again.",
        },
      ]);
    } finally {
      setLoading(false);
      inputRef.current?.focus();
    }
  };

  // Handle form submit
  const handleSubmit = (e) => {
    e.preventDefault();
    sendMessage();
  };

  // New chat
  const handleNewChat = () => {
    if (loading) return;

    setMessages(initialMessages);
    setInput("");

    if (chatAreaRef.current) {
      chatAreaRef.current.scrollTo({
        top: 0,
        behavior: "smooth",
      });
    }

    inputRef.current?.focus();
  };

  // Quick actions
  const quickActions = [
    {
      icon: "🍜",
      label: "Menu",
      message: "Show me the restaurant menu.",
    },
    {
      icon: "🗓️",
      label: "Book a Table",
      message: "I want to book a table.",
    },
    {
      icon: "🕒",
      label: "Opening Hours",
      message: "What are your restaurant opening hours?",
    },
    {
      icon: "🎧",
      label: "Order Support",
      message: "I need help with my order.",
    },
  ];

  return (
    <div className={isEmbed ? "wokai-app embed-mode" : "wokai-app"}>
      {/* Header is hidden when URL contains ?embed=1 */}
      {!isEmbed && (
        <header className="top-header">
          <div className="brand">
            <img
              src="/the-wok-logo.png"
              alt="The Wok Logo"
              className="brand-logo"
            />

            <div className="brand-text">
              <h1>WokAI</h1>
              <p>The Wok – Chinese Kitchen</p>
            </div>
          </div>

          <div className="header-actions">
            <div className="online-status">
              <span className="status-dot"></span>
              Online
            </div>

            <button
              className="new-chat-button"
              onClick={handleNewChat}
              disabled={loading}
            >
              + New Chat
            </button>

            <a
              href={WEBSITE_URL}
              className="website-button"
            >
              Visit The Wok Website
              <span>↗</span>
            </a>
          </div>
        </header>
      )}

      {/* Chat area */}
      <main className="chat-area" ref={chatAreaRef}>
        <div className="date-label">TODAY</div>

        <div className="messages-container">
          {messages.map((msg, index) => (
            <div
              key={index}
              className={`message-row ${msg.role}`}
            >
              {msg.role === "assistant" && (
                <img
                  src="/wokai-assistant.png"
                  alt="WokAI Assistant"
                  className="bot-avatar"
                />
              )}

              <div className="message-bubble">
                {msg.role === "assistant" ? (
                  <ReactMarkdown>{msg.text}</ReactMarkdown>
                ) : (
                  msg.text
                )}
              </div>
            </div>
          ))}

          {/* Typing indicator */}
          {loading && (
            <div className="message-row assistant">
              <img
                src="/wokai-assistant.png"
                alt="WokAI"
                className="bot-avatar"
              />

              <div className="message-bubble typing-bubble">
                WokAI is typing

                <span className="typing-dots">
                  <i></i>
                  <i></i>
                  <i></i>
                </span>
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Quick actions */}
      <section className="quick-actions">
        {quickActions.map((action) => (
          <button
            key={action.label}
            onClick={() => sendMessage(action.message)}
            disabled={loading}
            type="button"
          >
            <span>{action.icon}</span>
            {action.label}
          </button>
        ))}
      </section>

      {/* Chat input */}
      <footer className="chat-footer">
        <form
          className="input-wrapper"
          onSubmit={handleSubmit}
        >
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter" && !e.shiftKey) {
                e.preventDefault();
                handleSubmit(e);
              }
            }}
            placeholder="Ask WokAI anything..."
            rows="1"
            disabled={loading}
          />

          <button
            type="submit"
            className="send-button"
            disabled={!input.trim() || loading}
            aria-label="Send message"
          >
            ➤
          </button>
        </form>

        <p className="footer-note">
          Powered by WokAI · The Wok Chinese Kitchen
        </p>
      </footer>
    </div>
  );
}

export default App;