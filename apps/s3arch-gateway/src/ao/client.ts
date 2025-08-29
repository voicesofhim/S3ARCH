import { message, createDataItemSigner } from '@permaweb/aoconnect'

type TagMap = Record<string, string | number | boolean>

type MessageOptions = {
  processId: string
  action: string
  tags?: TagMap
  data?: any
}

export async function sendAOMessage(opts: MessageOptions) {
  console.log('sendAOMessage called with:', opts)
  
  const { processId, action, tags, data } = opts
  
  // Check if wallet is available
  const wallet = (window as any).arweaveWallet
  if (!wallet) throw new Error('Arweave wallet not available')
  
  // Create the message tags
  const messageTags = [
    { name: 'Action', value: action },
    ...(tags ? Object.entries(tags).map(([name, value]) => ({ name, value: String(value) })) : []),
  ]
  
  console.log('Sending AO message:', { processId, tags: messageTags, data })
  
  try {
    // Use aoconnect to send the message properly
    const messageId = await message({
      process: processId,
      tags: messageTags,
      data: data ? (typeof data === 'string' ? data : JSON.stringify(data)) : undefined,
      signer: createDataItemSigner(wallet),
    })
    
    console.log('AO message sent successfully, ID:', messageId)
    return messageId
  } catch (error) {
    console.error('AO message failed:', error)
    throw error
  }
}

// Helper function to query balance with timeout and response handling
export async function queryBalance(processId: string, scheduler: string, target: string): Promise<string> {
  try {
    console.log('Starting balance query...')
    console.log('Process ID:', processId)
    console.log('Target:', target)
    
    // Add timeout to prevent hanging
    const timeoutPromise = new Promise<string>((_, reject) => {
      setTimeout(() => reject(new Error('Balance query timed out after 15 seconds')), 15000)
    })
    
    const queryPromise = sendAOMessage({
      processId,
      action: 'Balance',
      tags: { Target: target },
    }).then(messageId => {
      console.log('Balance query message sent, ID:', messageId)
      // For now, return a success message since we don't have result parsing yet
      // In a real implementation, you'd use the messageId to fetch the result
      return `Balance query sent successfully (Message ID: ${messageId.slice(0, 8)}...)`
    })

    console.log('Sending balance query...')
    const result = await Promise.race([queryPromise, timeoutPromise])
    console.log('Balance query completed, result:', result)
    
    return result
  } catch (error) {
    console.error('Balance query error:', error)
    throw error
  }
}


