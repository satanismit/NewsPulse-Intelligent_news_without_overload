import { useState, useRef, useEffect } from 'react'
import axios from 'axios'
import { HiPaperAirplane, HiUser, HiSparkles, HiRefresh } from 'react-icons/hi'

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
            <h1>AI Chat Assistant</h1>
          </div>
        </div>
      </div>

      {/* Main Chat Interface */}
      <div className="chat-layout">
        <div className="chat-section">
          <div className="chat-header">
            <h3>AI Chat</h3>
            <button onClick={clearChat} className="clear-chat-btn">
              <HiRefresh size={16} />
            </button>
          </div>

          {/* Messages */}
          <div className="messages-container">
            {messages.map((message) => (
              <div 
                key={message.id} 
                className={`message ${message.type} ${message.isError ? 'error' : ''}`}
              >
                <div className="message-avatar">
                  {message.type === 'user' ? (
                    <HiUser size={16} />
                  ) : (
                    <HiSparkles size={16} />
                  )}
                </div>
                <div className="message-content">
                  <div className="message-text">
                    {message.formatted && message.sections ? (
                      <FormattedMessage sections={message.sections} />
                    ) : (
                      <div className="plain-text">{message.content}</div>
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
                  <HiSparkles size={16} />
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
              <h4>Try asking:</h4>
              <div className="question-chips">
                {suggestedQuestions.slice(0, 4).map((question, index) => (
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
                placeholder="Ask me anything about news..."
                disabled={isLoading}
                rows={2}
                className="message-input"
              />
              <button
                onClick={sendMessage}
                disabled={!inputMessage.trim() || isLoading}
                className="send-button"
              >
                <HiPaperAirplane size={18} />
              </button>
            </div>
            {error && <div className="error-message">{error}</div>}
          </div>
        </div>

      </div>
    </div>
  )
}

export default Chatbot
