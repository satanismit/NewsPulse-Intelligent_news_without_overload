import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { HiPaperAirplane, HiUser, HiSparkles, HiRefresh, HiX } from 'react-icons/hi'

// Formatted Message Component
const FormattedMessage = ({ sections }) => {
  const renderSection = (section, index) => {
    switch (section.type) {
      case 'header':
        const HeaderTag = section.level === 2 ? 'h3' : 'h4'
        return (
          <HeaderTag key={index} className={`formatted-header level-${section.level}`}>
            {section.content[0]}
          </HeaderTag>
        )
      
      case 'bullet_list':
        return (
          <ul key={index} className="formatted-list bullet-list">
            {section.content.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ul>
        )
      
      case 'numbered_list':
        return (
          <ol key={index} className="formatted-list numbered-list">
            {section.content.map((item, i) => (
              <li key={i}>{item}</li>
            ))}
          </ol>
        )
      
      case 'paragraph':
      default:
        return (
          <div key={index} className="formatted-paragraph">
            {section.content.map((line, i) => (
              <p key={i}>{line}</p>
            ))}
          </div>
        )
    }
  }

  return (
    <div className="formatted-content">
      {sections.map((section, index) => renderSection(section, index))}
    </div>
  )
}

// Response Display Component
const ResponseDisplay = ({ selectedMessage, onClose }) => {
  if (!selectedMessage) return null

  return (
    <div className="response-display">
      <div className="response-header">
        <h3>Response Details</h3>
        <button onClick={onClose} className="close-btn">
          <HiX size={20} />
        </button>
      </div>
      <div className="response-content">
        <div className="response-meta">
          <span className="response-time">
            {selectedMessage.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
          </span>
          <span className="response-type">AI Response</span>
        </div>
        <div className="response-text">
          {selectedMessage.formatted && selectedMessage.sections ? (
            <FormattedMessage sections={selectedMessage.sections} />
          ) : (
            <div className="plain-text">{selectedMessage.content}</div>
          )}
        </div>
      </div>
    </div>
  )
}

function Chatbot() {
  const [messages, setMessages] = useState([
    {
      id: 1,
      type: 'bot',
      content: 'Hello! I\'m your AI news assistant. I can help you with news analysis, summaries, and answer questions about current events. How can I help you today?',
      timestamp: new Date()
    }
  ])
  const [inputMessage, setInputMessage] = useState('')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState(null)
  const [selectedMessage, setSelectedMessage] = useState(null)
  const messagesEndRef = useRef(null)

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" })
  }

  useEffect(() => {
    scrollToBottom()
  }, [messages])

  const sendMessage = async () => {
    if (!inputMessage.trim() || isLoading) return

    const userMessage = {
      id: Date.now(),
      type: 'user',
      content: inputMessage,
      timestamp: new Date()
    }

    setMessages(prev => [...prev, userMessage])
    setInputMessage('')
    setIsLoading(true)
    setError(null)

    try {
      const response = await axios.post('http://localhost:8000/chat', {
        query: inputMessage
      })

      const botMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: response.data.text,
        formatted: response.data.formatted,
        sections: response.data.sections,
        timestamp: new Date()
      }

      setMessages(prev => [...prev, botMessage])
      // Auto-select the latest bot response
      setSelectedMessage(botMessage)
    } catch (err) {
      console.error('Chat error:', err)
      setError('Failed to get response. Please try again.')
      
      const errorMessage = {
        id: Date.now() + 1,
        type: 'bot',
        content: 'Sorry, I encountered an error. Please try again or check your connection.',
        timestamp: new Date(),
        isError: true
      }
      
      setMessages(prev => [...prev, errorMessage])
    } finally {
      setIsLoading(false)
    }
  }

  const handleKeyPress = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  const clearChat = () => {
    setMessages([
      {
        id: Date.now(),
        type: 'bot',
        content: 'Hello! I\'m your AI news assistant. I can help you with news analysis, summaries, and answer questions about current events. How can I help you today?',
        timestamp: new Date()
      }
    ])
    setError(null)
    setSelectedMessage(null)
  }

  const handleMessageClick = (message) => {
    if (message.type === 'bot') {
      setSelectedMessage(message)
    }
  }

  const suggestedQuestions = [
    "What are the latest technology trends?",
    "Can you summarize today's top news?",
    "What's happening in the business world?",
    "Tell me about recent sports events",
    "What are the current political developments?",
    "Explain the impact of AI on modern society",
    "What are the key challenges in climate change?",
    "How is the global economy performing?"
  ]

  return (
    <div className="chatbot-page">
      {/* Header */}
      <div className="chatbot-header">
        <div className="header-content">
          <div className="header-left">
            <HiSparkles size={24} className="sparkle-icon" />
            <h1>AI News Assistant</h1>
          </div>
          <button onClick={clearChat} className="clear-chat-btn">
            <HiRefresh size={16} />
            Clear Chat
          </button>
        </div>
      </div>

      {/* Main Chat Layout */}
      <div className="chat-layout">
        {/* Left Side - Chat Interface */}
        <div className="chat-interface">
          {/* Messages */}
          <div className="messages-container">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.type} ${message.isError ? 'error' : ''} ${selectedMessage?.id === message.id ? 'selected' : ''}`}
                onClick={() => handleMessageClick(message)}
              >
                <div className="message-avatar">
                  {message.type === 'user' ? (
                    <HiUser size={20} />
                  ) : (
                    <HiSparkles size={20} />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.formatted && message.sections ? (
                      <div className="message-preview">
                        {message.sections[0]?.content?.[0] || message.content.substring(0, 100)}
                        {message.content.length > 100 && '...'}
                      </div>
                    ) : (
                      <div className="message-preview">
                        {message.content.substring(0, 100)}
                        {message.content.length > 100 && '...'}
                      </div>
                    )}
                  </div>
                  <div className="message-timestamp">
                    {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </div>
                </div>
              </div>
            ))}
            
            {isLoading && (
              <div className="message bot">
                <div className="message-avatar">
                  <HiSparkles size={20} />
                </div>
                <div className="message-content">
                  <div className="typing-indicator">
                    <span></span>
                    <span></span>
                    <span></span>
                  </div>
                </div>
              </div>
            )}
            
            <div ref={messagesEndRef} />
          </div>

          {/* Suggested Questions */}
          {messages.length === 1 && (
            <div className="suggested-questions">
              <h3>Try asking me about:</h3>
              <div className="question-chips">
                {suggestedQuestions.map((question, index) => (
                  <button
                    key={index}
                    onClick={() => setInputMessage(question)}
                    className="question-chip"
                  >
                    {question}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Input Area */}
          <div className="input-area">
            <div className="input-container">
              <textarea
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Ask me anything about news, current events, or get analysis..."
                disabled={isLoading}
                rows={1}
                className="message-input"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="send-button"
              >
                <HiPaperAirplane size={20} />
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>

        {/* Right Side - Response Display */}
        <div className="response-panel">
          {selectedMessage ? (
            <ResponseDisplay 
              selectedMessage={selectedMessage} 
              onClose={() => setSelectedMessage(null)} 
            />
          ) : (
            <div className="response-placeholder">
              <div className="placeholder-content">
                <HiSparkles size={48} className="placeholder-icon" />
                <h3>Select a Response</h3>
                <p>Click on any AI response in the chat to view it in detail here.</p>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Features Info */}
      <div className="features-info">
        <div className="container">
          <h3>What I can help you with:</h3>
          <div className="features-grid">
            <div className="feature">
              <HiSparkles size={20} />
              <span>News Analysis & Summaries</span>
            </div>
            <div className="feature">
              <HiSparkles size={20} />
              <span>Current Events Discussion</span>
            </div>
            <div className="feature">
              <HiSparkles size={20} />
              <span>Trend Analysis</span>
            </div>
            <div className="feature">
              <HiSparkles size={20} />
              <span>Context & Background</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Chatbot
