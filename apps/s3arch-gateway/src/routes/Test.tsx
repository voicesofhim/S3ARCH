export default function Test() {
  return (
    <div style={{ padding: 24 }}>
      <h2>Test Page</h2>
      <p>This is a simple test page to verify routing works.</p>
      <div>
        <strong>Window objects:</strong>
        <ul>
          <li>arweaveWallet: {typeof (window as any).arweaveWallet}</li>
          <li>Location: {window.location.href}</li>
        </ul>
      </div>
    </div>
  )
}
