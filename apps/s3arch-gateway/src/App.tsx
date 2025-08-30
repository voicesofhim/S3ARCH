import { useState } from 'react'
import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Home from './routes/Home'
import Tim3 from './routes/Tim3'
import Test from './routes/Test'
import Simple from './routes/Simple'
import ProcessFlowDiagram from './components/ProcessFlowDiagram'

function App() {
  const [isFlowDiagramVisible, setIsFlowDiagramVisible] = useState(false)

  const toggleFlowDiagram = () => {
    setIsFlowDiagramVisible(!isFlowDiagramVisible)
  }

  return (
    <BrowserRouter>
      <div style={{ 
        display: 'flex', 
        flexDirection: 'column',
        minHeight: '100vh',
        background: '#fafafa'
      }}>
        {/* Header Navigation */}
        <div style={{ 
          padding: 16, 
          display: 'flex', 
          justifyContent: 'space-between',
          alignItems: 'center',
          borderBottom: '1px solid #eee',
          background: 'white',
          zIndex: 100
        }}>
          <div style={{ display: 'flex', gap: 12 }}>
            <Link to="/simple">Simple</Link>
            <Link to="/">Home</Link>
            <Link to="/tim3">TIM3</Link>
            <Link to="/test">Test</Link>
          </div>
          
          {/* Flow Diagram Toggle */}
          <button 
            onClick={toggleFlowDiagram}
            style={{
              padding: '6px 12px',
              background: isFlowDiagramVisible ? '#2563eb' : '#f3f4f6',
              color: isFlowDiagramVisible ? 'white' : '#374151',
              border: '1px solid #d1d5db',
              borderRadius: '6px',
              cursor: 'pointer',
              fontSize: '12px',
              fontWeight: '500',
              display: 'flex',
              alignItems: 'center',
              gap: '6px',
              transition: 'all 0.2s ease'
            }}
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
              <path d="M12 2l3.09 6.26L22 9.27l-5 4.87 1.18 6.88L12 17.77l-6.18 3.25L7 14.14 2 9.27l6.91-1.01L12 2z"/>
            </svg>
            Process Flow
          </button>
        </div>

        {/* Main Content */}
        <div style={{ 
          flex: 1, 
          paddingBottom: isFlowDiagramVisible ? '400px' : '0',
          transition: 'padding-bottom 0.3s ease'
        }}>
          <Routes>
            <Route path="/simple" element={<Simple />} />
            <Route path="/" element={<Home />} />
            <Route path="/tim3" element={<Tim3 />} />
            <Route path="/test" element={<Test />} />
          </Routes>
        </div>

        {/* Process Flow Diagram */}
        <ProcessFlowDiagram 
          isVisible={isFlowDiagramVisible}
          onToggle={toggleFlowDiagram}
        />
      </div>
    </BrowserRouter>
  )
}

export default App
