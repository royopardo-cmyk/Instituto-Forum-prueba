import React, { useState, useEffect, useRef, useCallback } from 'react';
import { ChatMessage, MessageRole } from '../types';
import Message from './Message';
import { getGeminiChat, sendMessageToGemini } from '../services/geminiService';
import { Chat } from '@google/genai';
import { INITIAL_BOT_MESSAGE, GENERAL_CONTACT_INFO } from '../constants';

const ChatWindow: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState<string>('');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatInstanceRef = useRef<Chat | null>(null);

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, []);

  const addMessage = useCallback((message: ChatMessage) => {
    setMessages((prevMessages) => {
      // If the last message was a typing indicator from the bot,
      // and the new message is also from the bot, update the last one.
      if (
        message.role === MessageRole.BOT &&
        prevMessages.length > 0 &&
        prevMessages[prevMessages.length - 1].isTyping
      ) {
        const lastMessage = prevMessages[prevMessages.length - 1];
        return [
          ...prevMessages.slice(0, prevMessages.length - 1),
          { ...lastMessage, content: lastMessage.content + message.content, isTyping: message.isTyping },
        ];
      }
      return [...prevMessages, message];
    });
  }, []);

  useEffect(() => {
    const initializeChat = async () => {
      try {
        const chat = await getGeminiChat();
        chatInstanceRef.current = chat;
        // Add initial bot message
        addMessage({
          id: `bot-${Date.now()}-initial`,
          role: MessageRole.BOT,
          content: INITIAL_BOT_MESSAGE,
          isTyping: false,
        });
      } catch (error) {
        console.error("Failed to initialize chat:", error);
        addMessage({
          id: `bot-${Date.now()}-error`,
          role: MessageRole.BOT,
          content: `Lo siento, parece que hay un problema al iniciar la comunicación. Por favor, intenta de nuevo más tarde o contacta directamente: ${GENERAL_CONTACT_INFO.email}`,
          isTyping: false,
        });
      }
    };
    initializeChat();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Run only once on component mount

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  const handleSendMessage = async (event: React.FormEvent) => {
    event.preventDefault();
    if (!input.trim() || isLoading) return;

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: MessageRole.USER,
      content: input,
    };
    setMessages((prev) => [...prev, userMessage]);
    setInput('');
    setIsLoading(true);

    // Add a temporary typing indicator for the bot
    setMessages((prev) => [
      ...prev,
      {
        id: `bot-${Date.now()}-typing`,
        role: MessageRole.BOT,
        content: '',
        isTyping: true,
      },
    ]);

    try {
      if (!chatInstanceRef.current) {
        throw new Error("Chat instance is not available.");
      }
      const responseStream = await sendMessageToGemini(input, chatInstanceRef.current);
      let fullResponse = '';

      for await (const chunk of responseStream) {
        if (chunk.text) {
          fullResponse += chunk.text;
          setMessages((prevMessages) => {
            const lastMessage = prevMessages[prevMessages.length - 1];
            if (lastMessage.isTyping && lastMessage.role === MessageRole.BOT) {
              return [
                ...prevMessages.slice(0, prevMessages.length - 1),
                { ...lastMessage, content: fullResponse, isTyping: true }, // Keep typing true until stream ends
              ];
            }
            return [...prevMessages, { id: `bot-${Date.now()}`, role: MessageRole.BOT, content: chunk.text, isTyping: true }];
          });
        }
      }

      // After the stream ends, update the last message to remove typing indicator
      setMessages((prevMessages) => {
        const lastMessage = prevMessages[prevMessages.length - 1];
        if (lastMessage.isTyping && lastMessage.role === MessageRole.BOT) {
          return [
            ...prevMessages.slice(0, prevMessages.length - 1),
            { ...lastMessage, isTyping: false },
          ];
        }
        return prevMessages; // Should not happen if typing indicator was correctly added
      });

    } catch (error: any) {
      console.error("Error receiving message from Gemini:", error);
      let errorMessage = 'Hubo un error al procesar tu solicitud.';
      if (error.message && error.message.includes("Requested entity was not found.")) {
        errorMessage = `¡Oh, parece que nuestra conexión con el universo digital tuvo una interrupción crítica! Necesito que elijas tu clave API de nuevo para que podamos seguir desvelando tu futuro. Por favor, abre el selector de claves.`;
        // Handle API key selection if applicable, though the prompt implies it's handled externally.
        // For this context, we will just display the message.
      } else if (error.message) {
        errorMessage += ` Detalles: ${error.message}`;
      }

      setMessages((prev) => {
        const lastMessage = prev[prev.length - 1];
        if (lastMessage.isTyping && lastMessage.role === MessageRole.BOT) {
          return [
            ...prev.slice(0, prev.length - 1),
            { ...lastMessage, content: lastMessage.content + " " + errorMessage, isTyping: false },
          ];
        }
        return [...prev, { id: `bot-${Date.now()}-error`, role: MessageRole.BOT, content: errorMessage, isTyping: false }];
      });
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-full bg-forum-light-gray rounded-lg shadow-xl overflow-hidden max-w-2xl mx-auto my-4 sm:my-8 md:my-12">
      {/* Header */}
      <div className="bg-forum-blue text-white p-4 text-center font-bold text-lg shadow-md">
        Asesor del Instituto Forum
      </div>

      {/* Chat Messages */}
      <div className="flex-1 p-4 overflow-y-auto custom-scrollbar">
        {messages.map((msg) => (
          <Message key={msg.id} message={msg} />
        ))}
        {/* Invisible div for scrolling */}
        <div ref={messagesEndRef} />
      </div>

      {/* Input Area */}
      <form onSubmit={handleSendMessage} className="sticky bottom-0 bg-white p-4 border-t border-gray-200 shadow-lg flex items-center">
        <input
          type="text"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder={isLoading ? "Asesor escribiendo..." : "Envía tu pregunta..."}
          className="flex-1 p-3 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-forum-accent transition-all duration-200 text-forum-dark-gray placeholder-gray-500"
          disabled={isLoading}
        />
        <button
          type="submit"
          className={`ml-3 px-6 py-3 rounded-lg font-semibold transition-all duration-300
            ${isLoading ? 'bg-gray-400 cursor-not-allowed' : 'bg-forum-accent hover:bg-forum-blue text-white'}`}
          disabled={isLoading}
        >
          Enviar
        </button>
      </form>
    </div>
  );
};

export default ChatWindow;