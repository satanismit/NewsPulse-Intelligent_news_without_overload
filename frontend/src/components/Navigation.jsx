import React, { useEffect, useState } from "react"
import { motion } from "framer-motion"
import { NavLink, Link, useLocation } from 'react-router-dom'
import { HiNewspaper, HiHome, HiGlobeAlt, HiChat, HiBell } from 'react-icons/hi'
import { cn } from "../lib/utils"

const navItems = [
  { name: "Home", url: "/", icon: HiHome },
  { name: "Articles", url: "/articles", icon: HiGlobeAlt },
  { name: "AI Chat", url: "/chatbot", icon: HiChat },
  { name: "Notifications", url: "/notifications", icon: HiBell },
]

function Navigation() {
  const location = useLocation()
  const [activeTab, setActiveTab] = useState("")
  const [isMobile, setIsMobile] = useState(false)

  useEffect(() => {
    const handleResize = () => {
      setIsMobile(window.innerWidth < 768)
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [])

  useEffect(() => {
    // Set active tab based on current location
    const currentItem = navItems.find(item => 
      item.url === "/" ? location.pathname === "/" : location.pathname.startsWith(item.url)
    )
    if (currentItem) {
      setActiveTab(currentItem.name)
    }
  }, [location.pathname])

  return (
    <nav className="main-navigation" aria-label="Main navigation">
      <div className="nav-container">
        {/* Brand Logo */}
        <Link to="/" className="nav-brand">
          <div className="brand-badge">
            <HiNewspaper size={18} />
          </div>
          <span>PulseAI</span>
        </Link>

        {/* Navigation Items */}
        <div className="nav-pill-container">
          <div className="nav-pill-wrapper">
            {navItems.map((item) => {
              const Icon = item.icon
              const isActive = activeTab === item.name

              return (
                <NavLink
                  key={item.name}
                  to={item.url}
                  onClick={() => setActiveTab(item.name)}
                  className={cn(
                    "nav-pill-item",
                    isActive && "nav-pill-active"
                  )}
                  end={item.url === "/"}
                >
                  <span className="nav-pill-text">{item.name}</span>
                  <span className="nav-pill-icon">
                    <Icon size={18} strokeWidth={2.5} />
                  </span>
                  {isActive && (
                    <motion.div
                      layoutId="lamp"
                      className="nav-pill-highlight"
                      initial={false}
                      transition={{
                        type: "spring",
                        stiffness: 300,
                        damping: 30,
                      }}
                    >
                      <div className="nav-pill-glow">
                        <div className="nav-pill-glow-1" />
                        <div className="nav-pill-glow-2" />
                        <div className="nav-pill-glow-3" />
                      </div>
                    </motion.div>
                  )}
                </NavLink>
              )
            })}
          </div>
        </div>
      </div>
    </nav>
  )
}

export default Navigation
