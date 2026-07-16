'use client';

import { type ComponentProps } from 'react';
import { type AgentState, type ReceivedMessage } from '@livekit/components-react';
import {
  Conversation,
  ConversationContent,
  ConversationScrollButton,
} from '../../../components/ai-elements/conversation';
import {
  Message,
  MessageContent,
  MessageResponse,
} from "../../../components/ai-elements/message"
import { AgentChatIndicator } from '~/components/agents-ui/agent-chat-indicator';
import { AnimatePresence } from 'motion/react';

export interface AgentChatTranscriptProps extends ComponentProps<'div'> {
  agentState?: AgentState;
  messages?: ReceivedMessage[];
  className?: string;
}

export function AgentChatTranscript({
  agentState,
  messages = [],
  className,
  ...props
}: AgentChatTranscriptProps) {
  return (
    <Conversation className={className} {...props}>
      <ConversationContent>
        {messages.map((receivedMessage) => {
          const { id, timestamp, from, message } = receivedMessage;
          const time = new Date(timestamp);
          const messageOrigin = from?.isLocal ? 'user' : 'assistant';
          const locale = typeof navigator !== 'undefined' ? navigator.language : 'en-US';
          const title = time.toLocaleTimeString(locale, { timeStyle: 'full' });

          return (
            <Message key={id} title={title} from={messageOrigin}>
              <MessageContent>
                <MessageResponse>{message}</MessageResponse>
              </MessageContent>
            </Message>
          );
        })}
        <AnimatePresence>
          {agentState === 'thinking' && <AgentChatIndicator size="sm" />}
        </AnimatePresence>
      </ConversationContent>
      <ConversationScrollButton />
    </Conversation>
  );
}
