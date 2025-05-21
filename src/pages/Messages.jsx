// Messages.jsx
import { useEffect, useState, useRef } from 'react';
import "../styles/Messages.css";
import { retrieveMessages, listenToChat, sendMessage } from '../services/messaging';

const Messages = ({user, employees, baseChats }) => {
  const [selectedChat, setSelectedChat] = useState(null);
  const [messageInput, setMessageInput] = useState('');
  const [chats, setChats] = useState(baseChats);
  const messagesEndRef = useRef(null);
  const isMobileNative = window.matchMedia('(max-width: 768px), (hover: none) and (orientation: portrait)').matches;
  const [showChatList, setShowChatList] = useState(false);


  const handleSend = (e) => {
    e.preventDefault();
    if (messageInput.trim() && selectedChat) {
        console.log("sending: ", selectedChat.id, messageInput, user.email);
      sendMessage(selectedChat.id, messageInput, user.email);
      setMessageInput('');
    }
  };


  useEffect(() => {
    if (!selectedChat) return;
  
    const unsubscribe = listenToChat(selectedChat.id, (messages) => {
      setChats((prevChats) => {
        return prevChats.map((chat) => {
          if (chat.id === selectedChat.id) {
            const updated = { ...chat, messages };
            setSelectedChat(updated);
            console.log("Update: ", updated);
            return updated;
          }
          return chat;
        });
      });
    });
    return () => unsubscribe();
  }, [selectedChat?.id]);
  

  

  return (
    <div className="messages-container">
      {/* Chat List Sidebar */}
      {isMobileNative ? (
        <>
          <div className="chat-selector" onClick={() => setShowChatList(!showChatList)}>
            <div className="chat-selector-header">
              <span>{selectedChat ? getChatDisplayName(selectedChat, user, employees) : "Select Chat"}</span>
              <span>{showChatList ? '▲' : '▼'}</span>
            </div>
          </div>
          <div className={`chat-list ${showChatList ? 'active' : ''}`}>
            {chats.map((chat) => (
              <ChatListItem
                key={chat.participants.join()}
                chat={chat}
                user={user}
                employees={employees}
                onSelect={() => {
                  setSelectedChat(chat);
                  setShowChatList(false);
                }}
                isSelected={selectedChat === chat}
              />
            ))}
          </div>
        </>
      ) : (
      <div className="chat-list">
        <h2>Chats</h2>
        {chats && chats.map((chat) => (
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
        )}
      {/* Message Area */}
      <div className="message-area">
        {(chats && selectedChat) ? (
          <>
          {!isMobileNative && 
            <div className="chat-header">
              {getChatDisplayName(selectedChat, user, employees)}
            </div>
            }
            
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
    const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({
      behavior: 'smooth', // Smooth scrolling animation
      block: 'nearest',   // Align to the bottom
    });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  return (
    <div className="message-list">
      {sortedMessages.map((message, index) => {
        const useGap = 
        (index == 0
            || sortedMessages[index-1].senderID != message.senderID 
            || message.date.getTime() - sortedMessages[index-1].date.getTime() >= 30 * 60 * 1000);
        if(index > 0) console.log(`${message.string}, (${message.date.getTime()} - ${sortedMessages[index-1].date.getTime()})returns ${message.date.getTime() - sortedMessages[index-1].date.getTime() >= 30 * 60 * 1000}`);
        return(
            <>
            {useGap && <div className='gap'/>}
            <Message
              key={index}
              message={message}
              isCurrentUser={message.senderID === user.email}
              employees={employees}
              useGap = {useGap}
            />
            </>);
      })}
        <div ref={messagesEndRef} />
    </div>
  );
};

// Helper component for individual message
const Message = ({ message, isCurrentUser, employees, useGap }) => {
  const sender = employees.find(emp => emp.email === message.senderID);
  const time = message.date.toLocaleTimeString([], { 
    hour: '2-digit', 
    minute: '2-digit' 
  });

  return (
    <div className={`message ${isCurrentUser ? 'current-user' : 'other-user'}`}>
      {(!isCurrentUser && useGap) &&  (
        <div className="sender-name">{sender?.name || message.senderID}</div>
      )}
      <div className="message-content">
        <div className="message-text">{message.string}</div>
        {useGap && <div className="message-time">{time}</div>}
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