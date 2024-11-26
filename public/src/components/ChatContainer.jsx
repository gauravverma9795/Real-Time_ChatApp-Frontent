import React, { useState, useEffect, useRef } from "react";
import styled from "styled-components";
import ChatInput from "./ChatInput";
import Logout from "./Logout";
import { v4 as uuidv4 } from "uuid";
import axios from "axios";
import { sendMessageRoute, recieveMessageRoute, editMessageRoute, deleteMessageRoute } from "../utils/APIRoutes";

export default function ChatContainer({ currentChat, socket }) {
  const [messages, setMessages] = useState([]);
  const [arrivalMessage, setArrivalMessage] = useState(null);
  const [selectedMessage, setSelectedMessage] = useState(null);
  const [editText, setEditText] = useState("");
  const [onlineUsers, setOnlineUsers] = useState([]);
  const scrollRef = useRef();

  useEffect(() => {
    const getMessages = async () => {
      const data = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
      const response = await axios.post(recieveMessageRoute, {
        from: data._id,
        to: currentChat._id,
      });
      setMessages(response.data);
    };
    getMessages();
  }, [currentChat]);

  useEffect(() => {
    if (socket.current) {
      socket.current.on("msg-recieve", (msg) => {
        setArrivalMessage({ fromSelf: false, message: msg });
      });

      socket.current.on("user-online", (data) => {
        setOnlineUsers((prev) => {
          const { userId, online } = data;
          if (online) {
            return [...prev, userId];
          } else {
            return prev.filter((id) => id !== userId);
          }
        });
      });
    }
  }, []);

  useEffect(() => {
    if (arrivalMessage) {
      setMessages((prev) => [...prev, arrivalMessage]);
    }
  }, [arrivalMessage]);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectedMessage && !event.target.closest('.context-menu')) {
        setSelectedMessage(null);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, [selectedMessage]);

  const handleSendMsg = async (msg) => {
    const data = await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY));
    socket.current.emit("send-msg", {
      to: currentChat._id,
      from: data._id,
      msg,
    });
    await axios.post(sendMessageRoute, {
      from: data._id,
      to: currentChat._id,
      message: msg,
    });

    const msgs = [...messages];
    msgs.push({ fromSelf: true, message: msg });
    setMessages(msgs);
  };

  const handleEdit = async () => {
    if (selectedMessage) {
      await axios.post(editMessageRoute, {
        messageId: selectedMessage._id,
        newText: editText,
      });
      setMessages((prev) =>
        prev.map((msg) =>
          msg._id === selectedMessage._id
            ? { ...msg, message: editText, edited: true }
            : msg
        )
      );
      setSelectedMessage(null);
      setEditText("");
    }
  };

  const handleDelete = async () => {
    if (selectedMessage) {
      await axios.post(deleteMessageRoute, {
        messageId: selectedMessage._id,
      });
      setMessages((prev) =>
        prev.filter((msg) => msg._id !== selectedMessage._id)
      );
      setSelectedMessage(null);
    }
  };

  return (
    <Container>
      <div className="chat-header">
        <div className="user-details">
          <div className="avatar">
            <img
              src={`data:image/svg+xml;base64,${currentChat.avatarImage}`}
              alt=""
            />
          </div>
          <div className="username">
            <h3>{currentChat.username}</h3>
            {onlineUsers.includes(currentChat._id) ? (
              <span className="online">Online</span>
            ) : (
              <span className="offline">Offline</span>
            )}
          </div>
        </div>
        <div className="logout"><Logout /></div>
        
      </div>
      <div className="chat-messages">
        {messages.map((message) => (
          <div
            ref={scrollRef}
            key={message._id}
            onClick={() => setSelectedMessage(message)}
          >
            <div
              className={`message ${
                message.fromSelf ? "sended" : "recieved"
              }`}
            >
              <div className="content">
                <p>{message.message}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      <ChatInput handleSendMsg={handleSendMsg} />
      {selectedMessage && (
        <div className="context-menu">
          <button className="close-button" onClick={() => setSelectedMessage(null)}>X</button>
          <textarea
            value={editText}
            onChange={(e) => setEditText(e.target.value)}
            placeholder="Edit your message"
          />
          <button onClick={() => handleEdit()}>Edit</button>
          <button onClick={() => handleDelete()}>Delete</button>
        </div>
      )}
    </Container>
  );
}

const Container = styled.div`
  display: grid;
  grid-template-rows: auto 1fr auto; /* Layout for mobile */
  height: 100vh; /* Full height for mobile */
  background-color: #131324;
  overflow: hidden; /* Prevent overflow */

  @media (min-width: 769px) {
    /* Default layout for larger screens */
    grid-template-rows: 10% 80% 10%;
  }

  .chat-header {
  
    display:flex;
    align-items: center;
    justify-content:space-between;
    padding: 1rem;
    position: relative;
    background-color: #080420;
    color: white;

    .user-details {
    
      display: flex;
      align-items: center;
      gap: 1rem;
      margin-left: 3rem;

      .avatar {
      
        position: relative; /* To position back button inside it */
        img {
          height: 3rem;
          border-radius: 50%; 
        }    
      }
      .username {   
        h3 {
          margin: 0;
        }
        .online {
          font-size: 0.8rem;
          color: green;
        }
        .offline {
          font-size: 0.8rem;
          color: red;
        }     
      }
    }
     .logout {
      margin-left: auto; /* Push the logout button to the extreme right */
      background: transparent;
      border: none;
      color: white;
      font-size: 1.5rem;
      cursor: pointer;
    }
    @media (min-width: 769px) {
      /* Default styles for larger screens */
      padding: 0 2rem;
    }
  }

  .chat-messages {
    padding: 1rem;
    overflow-y: auto; /* Scrollable area */
    display: flex;
    flex-direction: column;
    gap: 1rem;

    &::-webkit-scrollbar {
      width: 0.2rem;
      &-thumb {
        background-color: #ffffff39;
        border-radius: 1rem;
      }
    }

    .message {
      display: flex;
      align-items: center;
      cursor: pointer;

      .content {
        max-width: 100%;
        overflow-wrap: break-word;
        padding: 1rem;
        font-size: 1.1rem;
        border-radius: 1rem;
        color: #d1d1d1;

        @media (min-width: 769px) {
          max-width: 40%;
        }
      }
    }

    .sended {
      justify-content: flex-end;

      .content {
        background-color: #4f04ff21;
      }
    }

    .recieved {
      justify-content: flex-start;

      .content {
        background-color: #896aff;
      }
    }
  }

  .chat-input {
    position: fixed; /* Fixed position at the bottom */
    bottom: 0;
    width: 100%;
    background-color: #080420;
    padding: 1rem;
    border-top: 1px solid #333;
  }

  .context-menu {
    position: absolute;
    bottom: 10%;
    right: 5%;
    background-color: #b4e57e;
    color: white;
    padding: 1rem;
    border-radius: 8px;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.3);
    max-width: 300px;
    display: flex;
    flex-direction: column;
    gap: 10px;

    .close-button {
      position: absolute;
      top: 5px;
      right: 10px;
      background:black ;
      border: none;
      color:  white;
      font-size: 1.5rem;
      cursor: pointer;
    }

    textarea {
      width: 100%;
      height: 100px;
      background-color: white;
      color: black;
      border: none;
      border-radius: 5px;
      padding: 10px;
      margin-bottom: 10px;
      resize: none;
    }

    .button-container {
      display: flex;
      justify-content: space-between;

      button {
        background-color: #4f04ff;
        color: white;
        border: none;
        padding: 10px;
        border-radius: 5px;
        cursor: pointer;
        margin: 0;
        width: 48%;

        &:hover {
          background-color: #4f04ff8a;
        }
      }
    }
  }
`;


