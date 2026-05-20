import { compiledChatGraph } from '../chatbot/graph/chatbotGraph.js';
import { HumanMessage } from '@langchain/core/messages';

async function testQuery() {
  console.log("--- 🤖 Simulating Chatbot Query: 'còn phim nhà bà nữ thì sao' ---");
  const threadId = "test_thread_" + Math.random().toString(36).substring(7);
  
  try {
    const response = await compiledChatGraph.invoke(
      {
        messages: [new HumanMessage({ content: "còn phim nhà bà nữ thì sao" })],
        userId: "test-user-id"
      },
      {
        configurable: { thread_id: threadId }
      }
    );

    const lastMessage = response.messages[response.messages.length - 1];
    console.log("\n--- Chatbot Response ---");
    console.log(lastMessage.content);

  } catch (error) {
    console.error("Simulation failed:", error);
  }
}

testQuery();
