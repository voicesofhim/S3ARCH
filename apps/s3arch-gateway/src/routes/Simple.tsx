export default function Simple() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Simple S3ARCH Gateway</h2>
      <p>This is a basic page without wallet integration.</p>
      <div style={{ marginTop: 16 }}>
        <p><strong>Environment check:</strong></p>
        <ul>
          <li>React is working: ✅</li>
          <li>Routing is working: ✅</li>
          <li>Window object available: {typeof window !== 'undefined' ? '✅' : '❌'}</li>
        </ul>
      </div>
    </div>
  )
}
