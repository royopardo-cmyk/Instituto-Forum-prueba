
import React from 'react';
import { ChatMessage, MessageRole } from '../types';
import Markdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MessageProps {
  message: ChatMessage;
}

const Message: React.FC<MessageProps> = ({ message }) => {
  const isUser = message.role === MessageRole.USER;

  const messageClasses = isUser
    ? 'bg-forum-blue text-white self-end rounded-br-none'
    : 'bg-white text-forum-dark-gray self-start rounded-bl-none';

  return (
    <div className={`p-3 max-w-[80%] rounded-xl shadow-md mb-4 ${messageClasses}`}>
      <div className={`prose prose-sm max-w-none ${isUser ? 'text-white' : 'text-black'}`}>
        <Markdown remarkPlugins={[remarkGfm]}>
          {message.content}
        </Markdown>
        {message.isTyping && (
          <span className={`typing-indicator ml-2 ${isUser ? 'text-white' : 'text-black'}`}>
            <span>.</span><span>.</span><span>.</span>
          </span>
        )}
      </div>
    </div>
  );
};

export default Message;