/**
 * Example client for testing the /chat endpoint
 * Run with: node example-client.js
 */

async function streamChat(query) {
  try {
    const response = await fetch('http://localhost:3000/chat', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ query }),
    });

    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();

    console.log(`\n📡 Streaming response for query: "${query}"\n`);
    console.log('─'.repeat(60));

    while (true) {
      const { done, value } = await reader.read();
      if (done) {
        console.log('\n' + '─'.repeat(60));
        console.log('✅ Stream complete\n');
        break;
      }

      const chunk = decoder.decode(value);
      const lines = chunk.split('\n');

      for (const line of lines) {
        if (line.startsWith('data: ')) {
          const data = line.slice(6).trim();
          
          if (data === '[DONE]') {
            return;
          }
          
          try {
            const event = JSON.parse(data);
            
            switch (event.type) {
              case 'reasoning':
                process.stdout.write(`🧠 Reasoning: ${event.content}`);
                break;
              case 'tool_call':
                if (event.output === '') {
                  console.log(`\n🔧 Tool Call: ${event.tool}`);
                  console.log(`   Input: ${event.input}`);
                  console.log(`   Searching...`);
                } else {
                  console.log(`\n🔧 Tool Call: ${event.tool}`);
                  console.log(`   Input: ${event.input}`);
                  console.log(`   Output: ${event.output.substring(0, 200)}...`);
                }
                break;
              case 'response':
                process.stdout.write(`\n💬 Response: ${event.content}`);
                break;
              default:
                console.log(`\n📦 Event:`, event);
            }
          } catch (e) {
            // Skip invalid JSON
            if (data && data !== '[DONE]') {
              console.log('Raw data:', data);
            }
          }
        }
      }
    }
  } catch (error) {
    console.error('Error:', error.message);
  }
}

// Example usage
const query = process.argv[2] || 'Explain the state of AI in 2025?';
streamChat(query);

