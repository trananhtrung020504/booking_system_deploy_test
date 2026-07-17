import { StateGraph, Annotation, MessagesAnnotation, START } from '@langchain/langgraph';
import { PostgresSaver } from '@langchain/langgraph-checkpoint-postgres';
import pg from 'pg';
import { intentRouterNode } from '../nodes/intentNode.js';
import { movieNode, movieDetailNode, movieMissingNameNode } from '../nodes/movieNode.js';
import { bookingNode } from '../nodes/bookingNode.js';
import { showtimeNode, appQuestionNode, unknownNode, humanNode } from '../nodes/systemNode.js';

export const GraphStateAnnotation = Annotation.Root({
  ...MessagesAnnotation.spec,
  userId: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ''
  }),
  intent: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ''
  }),
  tool_call_count: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => 0
  }),
  conversationSummary: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ''
  }),
  recentContext: Annotation({
    reducer: (x, y) => y ?? x,
    default: () => ''
  })
});

const graph = new StateGraph(GraphStateAnnotation);

graph.addNode('intent_node', intentRouterNode, {
  ends: [
    'movie_node',
    'movie_detail_node',
    'movie_missing_name_node',
    'showtime_node',
    'booking_node',
    'app_question_node',
    'human_node',
    'unknown_node'
  ]
});
graph.addNode('movie_node', movieNode);
graph.addNode('movie_detail_node', movieDetailNode);
graph.addNode('movie_missing_name_node', movieMissingNameNode, {
  ends: [
    'movie_detail_node',
    'movie_node',
    'movie_missing_name_node',
    'booking_node',
    'showtime_node',
    'app_question_node',
    'human_node',
    'unknown_node'
  ]
});
graph.addNode('showtime_node', showtimeNode);
graph.addNode('booking_node', bookingNode, {
  ends: [
    'booking_node',
    'movie_node',
    'showtime_node',
    'app_question_node',
    'human_node',
    'unknown_node'
  ]
});
graph.addNode('app_question_node', appQuestionNode);
graph.addNode('unknown_node', unknownNode);
graph.addNode('human_node', humanNode);

graph.addEdge(START, 'intent_node');

const pool = new pg.Pool({
  connectionString: process.env.DATABASE_URL
});
const checkpointer = new PostgresSaver(pool);

await checkpointer.setup();

export const compiledChatGraph = graph.compile({
  checkpointer
});

console.log('[LangGraph] Movie Booking Chatbot Graph compiled successfully (Optimized High-Speed Architecture)!');
