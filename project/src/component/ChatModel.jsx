import { useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import { MessageCircle, X, Search, Trash2, Check, CheckCheck } from "lucide-react";
import AuthContext from "../AuthContext";
import axios from "axios";

const socket = io("http://localhost:5000");

const ChatModel = () => {
  const { user } = useContext(AuthContext);
  const [isOpen, setIsOpen] = useState(false);
  const [conversations, setConversations] = useState([]);
  const [selectedChat, setSelectedChat] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    if (!user) return;

    socket.connect();
    socket.emit("join", user._id);

    fetchConversations();

    const handleNewMessage = (message) => {
      if (selectedChat && (selectedChat._id === message.sender || selectedChat._id === message.receiver)) {
        setMessages((prev) => {
          const messageExists = prev.some(m => m._id === message._id);
          if (messageExists) return prev;
          return [...prev, message];
        });
      }
      fetchConversations();
    };

    socket.on("receiveMessage", handleNewMessage);

    return () => {
      socket.off("receiveMessage", handleNewMessage);
      socket.disconnect();
    };
  }, [user, selectedChat]);

  const fetchConversations = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/chats/conversations", {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setConversations(response.data);
    } catch (error) {
      console.error("Error fetching conversations:", error);
    }
  };

  const fetchMessages = async (userId) => {
    try {
      const response = await axios.get(`http://localhost:5000/api/chats/${userId}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setMessages(response.data);
    } catch (error) {
      console.error("Error fetching messages:", error);
    }
  };

  const sendMessage = async () => {
    if (!newMessage.trim() || !selectedChat) return;

    try {
      const response = await axios.post(
        "http://localhost:5000/api/chats",
        {
          receiverId: selectedChat._id,
          text: newMessage
        },
        {
          headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
        }
      );

      socket.emit("sendMessage", response.data);
      setMessages((prev) => [...prev, response.data]);
      setNewMessage("");
    } catch (error) {
      console.error("Error sending message:", error);
    }
  };

  const deleteMessage = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/chats/${id}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setMessages(prev => prev.filter(m => m._id !== id));
    } catch (error) {
      console.error("Error deleting message:", error);
    }
  };

  const searchUsers = async () => {
    try {
      const response = await axios.get(`http://localhost:5000/api/thoughts/users`, {
        headers: { Authorization: `Bearer ${localStorage.getItem("token")}` }
      });
      setUsers(response.data.filter(u => u._id !== user._id));
    } catch (error) {
      console.error("Error searching users:", error);
    }
  };

  useEffect(() => {
    if (isOpen) {
      searchUsers();
    }
  }, [isOpen]);

  const startNewChat = (selectedUser) => {
    setSelectedChat(selectedUser);
    fetchMessages(selectedUser._id);
  };

  const getTickIcon = (msg) => {
    if (msg.sender._id !== user._id) return null;
    if (msg.read) return <CheckCheck size={14} className="text-blue-500 ml-1" />;
    return <CheckCheck size={14} className="text-gray-500 ml-1" />;
  };

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        <MessageCircle size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-4 bg-white w-[700px] h-[600px] shadow-2xl rounded-lg flex flex-col">
          <div className="flex justify-between items-center bg-blue-600 text-white p-4 rounded-t-lg">
            <h2 className="text-lg font-bold">Messages</h2>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="flex h-full">
            {/* Users List */}
            <div className="w-2/5 border-r">
              <div className="p-2">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Search users..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="w-full p-2 border rounded-md pr-8"
                  />
                  <Search className="absolute right-2 top-2.5 text-gray-400" size={16} />
                </div>
              </div>

              <div className="overflow-y-auto h-[calc(100%-56px)]">
                {users
                  .filter(u => u.username.toLowerCase().includes(searchQuery.toLowerCase()))
                  .map((user) => {
                    const unread = conversations.find(c => c.user._id === user._id)?.unreadCount;
                    return (
                      <div
                        key={user._id}
                        onClick={() => startNewChat(user)}
                        className={`relative p-3 hover:bg-gray-100 cursor-pointer ${selectedChat?._id === user._id ? "bg-gray-100" : ""
                          }`}
                      >
                        <div className="flex items-center">
                          <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-2">
                            {user.username.charAt(0).toUpperCase()}
                          </span>
                          <p className="font-medium">{user.username}</p>
                          {unread > 0 && (
                            <span className="ml-auto bg-red-500 text-white text-xs rounded-full px-2 py-0.5">
                              {unread}
                            </span>
                          )}
                        </div>
                      </div>
                    );
                  })}
              </div>
            </div>

            {/* Chat Window */}
            <div className="w-3/5 flex flex-col">
              {selectedChat ? (
                <>
                  <div className="p-3 bg-gray-100 border-b">
                    <div className="flex items-center">
                      <span className="w-8 h-8 bg-blue-500 text-white rounded-full flex items-center justify-center mr-2">
                        {selectedChat.username.charAt(0).toUpperCase()}
                      </span>
                      <p className="font-medium">{selectedChat.username}</p>
                    </div>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {messages.map((msg, index) => (
                      <div
                        key={msg._id || index}
                        className={`mb-2 flex ${msg.sender._id === user._id ? "justify-end" : "justify-start"
                          }`}
                      >
                        {msg.sender._id !== user._id && (
                          <span className="w-6 h-6 bg-blue-500 text-white rounded-full flex items-center justify-center text-xs mr-2">
                            {msg.sender.username.charAt(0).toUpperCase()}
                          </span>
                        )}
                        <div className="relative group">
                          <div
                            className={`p-2 rounded-lg max-w-[70%] ${msg.sender._id === user._id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200"
                              }`}
                          >
                            <p>{msg.text}</p>
                            <div className="text-xs opacity-75 flex justify-end items-center">
                              {new Date(msg.createdAt).toLocaleTimeString()}
                              {getTickIcon(msg)}
                            </div>
                          </div>
                          {msg.sender._id === user._id && (
                            <button
                              onClick={() => deleteMessage(msg._id)}
                              className="absolute -top-2 -right-6 opacity-0 group-hover:opacity-100 transition text-red-500"
                              title="Delete"
                            >
                              <Trash2 size={16} />
                            </button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 border-t">
                    <div className="flex">
                      <input
                        type="text"
                        value={newMessage}
                        onChange={(e) => setNewMessage(e.target.value)}
                        onKeyDown={(e) => e.key === "Enter" && sendMessage()}
                        placeholder="Type a message..."
                        className="flex-1 p-2 border rounded-l-md focus:outline-none focus:ring-1 focus:ring-blue-500"
                      />
                      <button
                        onClick={sendMessage}
                        className="px-4 py-2 bg-blue-600 text-white rounded-r-md hover:bg-blue-700"
                      >
                        Send
                      </button>
                    </div>
                  </div>
                </>
              ) : (
                <div className="flex items-center justify-center h-full text-gray-500">
                  Select a conversation to start chatting
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatModel;
