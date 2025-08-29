import { message, result, createDataItemSigner } from '@permaweb/aoconnect'

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
export async function queryBalance(processId: string, target: string): Promise<string> {
  try {
    console.log('Starting balance query...')
    console.log('Process ID:', processId)
    console.log('Target:', target)
    
    // Step 1: Send the balance query message
    console.log('Sending balance query message...')
    const messageId = await sendAOMessage({
      processId,
      action: 'Balance',
      tags: { Target: target },
    })
    
    console.log('Balance query message sent, ID:', messageId)
    console.log('Waiting for response from AO process...')
    
    // Step 2: Wait for the result from the AO process
    const timeoutPromise = new Promise<never>((_, reject) => {
      setTimeout(() => reject(new Error('Balance query result timed out after 20 seconds')), 20000)
    })
    
    const resultPromise = result({
      message: messageId,
      process: processId,
    }).then((res: any) => {
      console.log('Raw AO result:', res)
      
      // Parse the result to extract balance information
      if (res?.Messages && res.Messages.length > 0) {
        const responseMessage = res.Messages[0]
        console.log('Response message:', responseMessage)
        
        // Look for balance in the response data or tags
        if (responseMessage.Data) {
          try {
            const data = JSON.parse(responseMessage.Data)
            console.log('Parsed response data:', data)
            
            // Try different balance field names and formats
            let balanceValue = null
            let ticker = 'tokens'
            
            if (data.balance !== undefined) {
              balanceValue = data.balance
              ticker = data.ticker || 'TIM3'
            } else if (data.Balance !== undefined) {
              balanceValue = data.Balance
              ticker = data.ticker || 'TIM3'
            } else if (data.available !== undefined) {
              balanceValue = data.available
              ticker = 'USDA'
            }
            
            if (balanceValue !== null) {
              console.log('Balance found:', balanceValue, ticker)
              return `${balanceValue} ${ticker}`
            }
          } catch (e) {
            // If not JSON, treat as plain text
            console.log('Response data (plain text):', responseMessage.Data)
            return responseMessage.Data
          }
        }
        
        // Check tags for balance info
        const balanceTag = responseMessage.Tags?.find((tag: any) => tag.name === 'Balance')
        if (balanceTag) {
          return `${balanceTag.value} TIM3`
        }
        
        return 'Balance query completed, but no balance found in response'
      }
      
      return 'No response messages received from AO process'
    })

    console.log('Waiting for AO process response...')
    const balanceResult = await Promise.race([resultPromise, timeoutPromise])
    console.log('Balance query completed, result:', balanceResult)
    
    return balanceResult
  } catch (error) {
    console.error('Balance query error:', error)
    throw error
  }
}


