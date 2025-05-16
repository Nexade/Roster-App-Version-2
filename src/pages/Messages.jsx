// Messages.jsx
import { useState } from 'react';
import "../styles/Messages.css";

const Messages = ({ chats, user, employees }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');

  const handleSend = (e) => {
    e.preventDefault();
    if (messageInput.trim() && selectedChat) {
      // Call parent component's send handler here
      setMessageInput('');
    }
  };

  return (
    <div className="messages-container">
      {/* Chat List Sidebar */}
      <div className="chat-list">
        <h2>Chats</h2>
        {chats.map((chat) => (
          <ChatListItem
            key={chat.participants.join()}
            chat={chat}
            user={user}
            employees={employees}
            onSelect={() => setSelectedChat(chat)}
            isSelected={selectedChat === chat}
          />
        ))}
      </div>

      {/* Message Area */}
      <div className="message-area">
        {selectedChat ? (
          <>
            <div className="chat-header">
              {getChatDisplayName(selectedChat, user, employees)}
            </div>
            
            <MessageList
              messages={selectedChat.messages}
              user={user}
              employees={employees}
            />

            <form onSubmit={handleSend} className="message-input">
              <input
                type="text"
                value={messageInput}
                onChange={(e) => setMessageInput(e.target.value)}
                placeholder="Type a message..."
              />
              <button type="submit">Send</button>
            </form>
          </>
        ) : (
          <div className="no-chat-selected">Select a chat to view messages</div>
        )}
      </div>
    </div>
  );
};


// Helper component for chat list items
const ChatListItem = ({ chat, user, employees, onSelect, isSelected }) => {
  const displayName = getChatDisplayName(chat, user, employees);
  return (
    <div 
      className={`chat-item ${isSelected ? 'selected' : ''}`}
      onClick={onSelect}
    >
      {displayName}
    </div>
  );
};

// Helper component for message list
const MessageList = ({ messages, user, employees }) => {
  const sortedMessages = [...messages].sort((a, b) => a.date - b.date);

  return (
    <div className="message-list">
      {sortedMessages.map((message, index) => (
        <Message
          key={index}
          message={message}
          isCurrentUser={message.senderID === user.email}
          employees={employees}
        />
      ))}
    </div>
  );
};

// Helper component for individual message
const Message = ({ message, isCurrentUser, employees }) => {
  const sender = employees.find(emp => emp.email === message.senderID);
  const time = message.date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`message ${isCurrentUser ? 'current-user' : 'other-user'}`}>
      {!isCurrentUser && (
        <div className="sender-name">{sender?.name || message.senderID}</div>
      )}
      <div className="message-content">
        <div className="message-text">{message.string}</div>
        <div className="message-time">{time}</div>
      </div>
    </div>
  );
};

// Helper function to get chat display name
const getChatDisplayName = (chat, user, employees) => {
  if (chat.name) return chat.name;
  
  const otherParticipants = chat.participants.filter(email => email !== user.email);
  return otherParticipants
    .map(email => {
      const emp = employees.find(e => e.email === email);
      return emp ? emp.name : email;
    })
    .join(', ') || 'Group Chat';
};

export default Messages;