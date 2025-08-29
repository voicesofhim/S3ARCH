import { BrowserRouter, Link, Route, Routes } from 'react-router-dom'
import Home from './routes/Home'
import Tim3 from './routes/Tim3'
import Test from './routes/Test'
import Simple from './routes/Simple'

function App() {
  return (
    <BrowserRouter>
      <div style={{ padding: 16, display: 'flex', gap: 12, borderBottom: '1px solid #eee' }}>
        <Link to="/simple">Simple</Link>
        <Link to="/">Home</Link>
        <Link to="/tim3">TIM3</Link>
        <Link to="/test">Test</Link>
      </div>
      <Routes>
        <Route path="/simple" element={<Simple />} />
        <Route path="/" element={<Home />} />
        <Route path="/tim3" element={<Tim3 />} />
        <Route path="/test" element={<Test />} />
      </Routes>
    </BrowserRouter>
  )
}

export default App
