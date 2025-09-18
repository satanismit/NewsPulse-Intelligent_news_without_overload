import { HiNewspaper, HiChat, HiGlobeAlt, HiClock } from 'react-icons/hi'
import { Link } from 'react-router-dom'
import { BackgroundPaths } from './BackgroundPaths'
import { AnimatedCounter } from './AnimatedCounter'
import DisplayCards from './DisplayCards'

function Home() {
  return (
    <div className="home-page">
      {/* Animated Background */}
      <BackgroundPaths />
      
      {/* Main Content */}
      <div className="home-content">
        {/* Hero Section */}
        <section className="hero-section">
        <div className="hero-content">
          <div className="hero-icon">
            <HiNewspaper size={80} />
          </div>
          <h1 className="hero-title">Welcome to PulseAI</h1>
          <p className="hero-subtitle">
            Your intelligent news aggregator powered by AI sentiment analysis and smart categorization
          </p>
          <div className="hero-actions">
            <Link to="/articles" className="hero-btn primary">
              <HiGlobeAlt size={20} />
              Browse News
            </Link>
            <Link to="/chatbot" className="hero-btn secondary">
              <HiChat size={20} />
              AI Chat
            </Link>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Why Choose PulseAI?</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">
                <HiClock size={32} />
              </div>
              <h3>Real-time Updates</h3>
              <p>Get the latest news from multiple sources with automatic updates and smart categorization.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <HiChat size={32} />
              </div>
              <h3>AI-Powered Analysis</h3>
              <p>Advanced sentiment analysis and intelligent categorization using cutting-edge AI technology.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <HiGlobeAlt size={32} />
              </div>
              <h3>Smart Filtering</h3>
              <p>Filter news by category, sentiment, and source to find exactly what interests you.</p>
            </div>
            
            <div className="feature-card">
              <div className="feature-icon">
                <HiNewspaper size={32} />
              </div>
              <h3>Comprehensive Coverage</h3>
              <p>Coverage across Politics, Technology, Business, Sports, Entertainment, Health, Education, and more.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="stats-section">
        <div className="container">
          <div className="stats-grid">
            <div className="stat-item">
              <AnimatedCounter target={8} duration={1.2} suffix="+" />
              <div className="stat-label">News Categories</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">AI</div>
              <div className="stat-label">Sentiment Analysis</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">Real-time</div>
              <div className="stat-label">Updates</div>
            </div>
            <div className="stat-item">
              <div className="stat-number">Smart</div>
              <div className="stat-label">Filtering</div>
            </div>
          </div>
        </div>
      </section>

      {/* Display Cards Section */}
      <section className="quick-start-section">
        <div className="container">
          <h2 className="section-title">Get Started</h2>
          <div className="display-cards-container">
            <DisplayCards />
          </div>
        </div>
      </section>
      </div>
    </div>
  )
}

export default Home
