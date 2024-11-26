import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { io } from "socket.io-client";
import styled from "styled-components";
import { allUsersRoute, host } from "../utils/APIRoutes";
import ChatContainer from "../components/ChatContainer";
import Contacts from "../components/Contacts";
import Welcome from "../components/Welcome";
import { FaArrowLeft } from 'react-icons/fa';

export default function Chat() {
  const navigate = useNavigate();
  const socket = useRef();
  const [contacts, setContacts] = useState([]);
  const [currentChat, setCurrentChat] = useState(undefined);
  const [currentUser, setCurrentUser] = useState(undefined);
  const [isMobile, setIsMobile] = useState(window.innerWidth <= 768);

  useEffect(() => {
    const fetchData = async () => {
      if (!localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY)) {
        navigate("/login");
      } else {
        setCurrentUser(
          await JSON.parse(localStorage.getItem(process.env.REACT_APP_LOCALHOST_KEY))
        );
      }
    };
    fetchData();
  }, [navigate]);

  useEffect(() => {
    if (currentUser) {
      socket.current = io(host);
      socket.current.emit("add-user", currentUser._id);
    }
  }, [currentUser]);

  useEffect(() => {
    const fetchContacts = async () => {
      if (currentUser) {
        if (currentUser.isAvatarImageSet) {
          const data = await axios.get(`${allUsersRoute}/${currentUser._id}`);
          setContacts(data.data);
        } else {
          navigate("/setAvatar");
        }
      }
    };
    fetchContacts();
  }, [currentUser, navigate]);

  useEffect(() => {
    const handleResize = () => setIsMobile(window.innerWidth <= 768);
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, []);

  const handleChatChange = (chat) => {
    setCurrentChat(chat);
    if (isMobile) {
      document.body.style.overflow = "hidden"; 
    }
  };

  const handleBack = () => {
    setCurrentChat(undefined);
    if (isMobile) {
      document.body.style.overflow = "auto"; 
    }
  };

  return (
    <Container>
      <div className={`container ${isMobile && currentChat ? "mobile-chat" : ""}`}>
        {isMobile && currentChat ? (
          <FullScreenChat>
            <button className="back-button" onClick={handleBack}> <FaArrowLeft /></button>
            <ChatContainer currentChat={currentChat} socket={socket} />
          </FullScreenChat>
        ) : (
          <>
            <Contacts contacts={contacts} changeChat={handleChatChange} />
            {currentChat === undefined ? (
              <Welcome />
            ) : (
              <ChatContainer currentChat={currentChat} socket={socket} />
            )}
          </>
        )}
      </div>
    </Container>
  ); 
}

const Container = styled.div`
  height: 100vh;
  width: 100vw;
  display: flex;
  flex-direction: column;
  background-color: #131324;

  .container {
    display: grid;
    grid-template-columns: 1fr 3fr;
    height: 100%;
    width: 100%;
    background-color: #00000076;
    overflow: hidden;

    @media (max-width: 768px) {
      grid-template-columns: 1fr;
      grid-template-rows: 1fr;
    }

    &.mobile-chat {
      grid-template-rows: 1fr;
      grid-template-columns: 1fr;
    }
  }
`;

const FullScreenChat = styled.div`
  height: 100vh;
  width: 100vw;
  background-color: #131324;
  position: relative;

  .back-button {
    position: absolute;
    top: 15px;
    left: 10px;
    background-color: transparent;
    color: white;
    border: none;
    font-size: 1.5rem; /* Adjust size as needed */
    cursor: pointer;
    z-index: 10;
    padding: 10px;
    transition: color 0.3s ease; /* Optional: smooth color transition on hover */
  }

  .back-button:hover {
    color: #4f04ff; /* Optional: change color on hover */
  }
`;
