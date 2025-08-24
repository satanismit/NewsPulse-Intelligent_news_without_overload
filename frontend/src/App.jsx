import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  HiNewspaper, HiClock, HiExternalLink, HiRefresh, HiInformationCircle,
  HiFilter, HiX, HiEmojiHappy, HiEmojiSad, HiMinus
} from 'react-icons/hi'
import { format, parseISO } from 'date-fns'
import './App.css'

// Helper: format dates safely
const formatDate = (dateString) => {
  if (!dateString || dateString === 'Unknown') return 'Recent'
  try { return format(parseISO(dateString), 'MMM dd, yyyy') }
  catch { return 'Recent' }
}

// Sentiment analysis
const analyzeSentiment = (text) => {
  const positiveWords = ['good','great','excellent','amazing','wonderful','fantastic','brilliant','outstanding','success','achievement','victory','win','positive','growth','improvement','progress','happy','joy','celebration','breakthrough','innovation','advancement','development','profit','gain','increase','rise','boost','surge','jump','climb','soar','leap']
  const negativeWords = ['bad','terrible','awful','horrible','disaster','crisis','problem','issue','failure','loss','defeat','negative','decline','drop','fall','crash','collapse','breakdown','sad','angry','fear','worry','concern','danger','threat','risk','attack','violence','death','injury','damage','destruction','corruption','scandal','controversy','conflict']

  const words = text.toLowerCase().split(/\s+/)
  let pos=0, neg=0
  words.forEach(word => { if (positiveWords.includes(word)) pos++; else if (negativeWords.includes(word)) neg++ })
  const total = pos + neg
  if(total===0) return 'neutral'
  if(pos/total>0.6) return 'positive'
  if(neg/total>0.6) return 'negative'
  return 'neutral'
}

// Category keywords
const categoryKeywords = {
  Politics:['election','government','minister','parliament','political','vote','democracy','congress','bjp','party'],
  Technology:['tech','technology','digital','app','software','ai','artificial intelligence','startup','innovation','cyber'],
  Business:['business','economy','market','stock','finance','investment','company','corporate','trade','economic'],
  Sports:['cricket','football','sports','match','tournament','player','team','game','olympics','ipl'],
  Entertainment:['movie','film','actor','actress','bollywood','hollywood','music','celebrity','entertainment','show'],
  Health:['health','medical','doctor','hospital','disease','covid','vaccine','medicine','treatment','healthcare'],
  Education:['education','school','college','university','student','exam','study','academic','learning','teacher'],
  International:['world','international','global','foreign','diplomatic','un','nato','europe','america','china']
}

// Category colors
const categoryColors = {
  Politics: '#ef4444',       // red
  Technology: '#3b82f6',     // blue
  Business: '#f59e0b',       // amber
  Sports: '#10b981',         // green
  Entertainment: '#8b5cf6',  // purple
  Health: '#ec4899',         // pink
  Education: '#14b8a6',      // teal
  International: '#f43f5e',  // rose
  Other: '#6b7280',          // gray
  All: '#000000'             // black
}

// Assign category to article
const assignCategory = (article) => {
  const text = `${article.title || ''} ${article.summary || ''}`.toLowerCase()
  for(const [cat, keys] of Object.entries(categoryKeywords)){
    if(keys.some(k=>text.includes(k))) return cat
  }
  return 'Other'
}

function App() {
  const [articles, setArticles] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [aboutInfo, setAboutInfo] = useState(null)
  const [selectedCategory, setSelectedCategory] = useState('All')
  const [selectedSentiment, setSelectedSentiment] = useState('All')
  const [showSidePanel, setShowSidePanel] = useState(false)

  const categories = ['All','Politics','Technology','Business','Sports','Entertainment','Health','Education','International','Other']
  const sentiments = ['All','Positive','Negative','Neutral']

  const getSentimentIcon = (sentiment) => {
    switch(sentiment){
      case 'positive': return <HiEmojiHappy size={16}/>
      case 'negative': return <HiEmojiSad size={16}/>
      case 'neutral': return <HiMinus size={16}/>
      default: return <HiMinus size={16}/>
    }
  }

  const getSentimentColor = (sentiment) => {
    switch(sentiment){
      case 'positive': return '#10b981'
      case 'negative': return '#ef4444'
      case 'neutral': return '#6b7280'
      default: return '#6b7280'
    }
  }

  // Fetch articles
  const fetchArticlesFromDB = async () => {
    setLoading(true)
    setError(null)
    try {
      const res = await axios.get('http://localhost:8000/articles')
      const fetched = res.data.articles.map(a => ({
        ...a,
        sentiment: analyzeSentiment(`${a.title || ''} ${a.summary || ''}`),
        category: assignCategory(a)
      }))
      setArticles(fetched)
    } catch(err){ console.error(err); setError('Failed to fetch articles') }
    finally{ setLoading(false) }
  }

  const fetchAbout = async () => {
    try { const res = await axios.get('http://localhost:8000/About'); setAboutInfo(res.data) } 
    catch(err){ console.error(err) }
  }

  useEffect(() => { fetchAbout(); fetchArticlesFromDB() }, [])

  const getArticlesToDisplay = () => {
    return articles.filter(a => 
      (selectedCategory==='All' || a.category===selectedCategory) &&
      (selectedSentiment==='All' || a.sentiment===selectedSentiment.toLowerCase())
    )
  }

  const getCategoryCount = (cat) => {
    return cat==='All' ? articles.length : articles.filter(a => a.category===cat).length
  }

  return (
    <div className="app">
      {/* Header */}
      <header className="header">
        <div className="header-content">
          <div className="logo"><HiNewspaper size={32}/> <h1>NewsPulse</h1></div>
          <div className="header-controls">
            <button onClick={fetchArticlesFromDB} disabled={loading}><HiRefresh size={16} className={loading?'spinning':''}/> Refresh</button>
            <button onClick={()=>setShowSidePanel(!showSidePanel)}><HiFilter size={16}/> Filters</button>
          </div>
        </div>
      </header>

      {/* Content */}
      <div className="content-wrapper">
        {showSidePanel && (
          <aside className="side-panel">
            <div className="side-panel-header">
              <h3>Filters</h3>
              <button onClick={()=>setShowSidePanel(false)}><HiX size={20}/></button>
            </div>

            {/* Categories */}
            <div className="filter-section">
              <h4>Categories</h4>
              {categories.map(cat=>(
                <button 
                  key={cat} 
                  onClick={() => setSelectedCategory(cat)} 
                  className={selectedCategory === cat ? 'active' : ''} 
                  style={{ 
                    backgroundColor: selectedCategory === cat ? categoryColors[cat] : '#f3f4f6', 
                    color: selectedCategory === cat ? '#fff' : '#000' 
                  }}
                >
                  {cat} ({getCategoryCount(cat)})
                </button>
              ))}
            </div>

            {/* Sentiments */}
            <div className="filter-section">
              <h4>Sentiment</h4>
              {sentiments.map(s=>(
                <button key={s} onClick={()=>setSelectedSentiment(s)} className={selectedSentiment===s?'active':''}>
                  {s==='All'?<HiFilter size={16}/>:getSentimentIcon(s.toLowerCase())} {s} ({s==='All'?articles.length:articles.filter(a=>a.sentiment===s.toLowerCase()).length})
                </button>
              ))}
            </div>
          </aside>
        )}

        <main className={`main-content ${showSidePanel?'with-side-panel':''}`}>
          {loading && <p>Loading articles...</p>}
          {!loading && error && <p>{error}</p>}
          {!loading && !error && getArticlesToDisplay().length===0 && <p>No articles found.</p>}
          {!loading && getArticlesToDisplay().length>0 && (
            <div className="articles-grid">
              {getArticlesToDisplay().map((a,i)=>(
                <article key={i} className="article-card">
                  <span className="source">{a.source}</span>
                  <h2>{a.title}</h2>
                  <p>{a.summary}</p>
                  <span>{formatDate(a.published)}</span>
                  <span className="sentiment-badge" style={{backgroundColor:getSentimentColor(a.sentiment)}}>{getSentimentIcon(a.sentiment)}</span>
                  <a href={a.link} target="_blank" rel="noopener noreferrer">Read Full</a>
                </article>
              ))}
            </div>
          )}
        </main>
      </div>

      {/* Footer */}
      {aboutInfo && <footer className="footer"><HiInformationCircle size={16}/> {aboutInfo.project} v{aboutInfo.version} • By {aboutInfo.developer}</footer>}
    </div>
  )
}

export default App
