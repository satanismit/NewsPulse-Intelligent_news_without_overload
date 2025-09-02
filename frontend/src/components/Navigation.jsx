import { NavLink } from 'react-router-dom'
import { HiNewspaper, HiHome, HiGlobeAlt, HiChat } from 'react-icons/hi'

function Navigation() {
  return (
    <nav className="main-navigation">
      <div className="nav-container">
        <div className="nav-brand">
          <HiNewspaper size={28} />
          <span>PulseAI</span>
        </div>
        
        <div className="nav-links">
          <NavLink 
            to="/" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
            end
          >
            <HiHome size={20} />
            <span>Home</span>
          </NavLink>
          
          <NavLink 
            to="/articles" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <HiGlobeAlt size={20} />
            <span>Articles</span>
          </NavLink>
          
          <NavLink 
            to="/chatbot" 
            className={({ isActive }) => `nav-link ${isActive ? 'active' : ''}`}
          >
            <HiChat size={20} />
            <span>AI Chat</span>
          </NavLink>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
