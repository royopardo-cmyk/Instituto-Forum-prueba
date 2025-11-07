
import React from 'react';
import ChatWindow from './components/ChatWindow';
import './index.css'; // Import the custom scrollbar styles

const App: React.FC = () => {
  return (
    <div className="flex flex-col h-screen bg-forum-light-gray">
      <main className="flex-1 flex justify-center items-stretch p-4">
        <ChatWindow />
      </main>
    </div>
  );
};

export default App;
