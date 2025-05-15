import { useEffect, useState, useContext } from "react";
import { io } from "socket.io-client";
import { MessageCircle, X, Search } from "lucide-react";
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

    // Connect to socket
    socket.connect();
    socket.emit("join", user._id);

    // Load conversations
    fetchConversations();

    // Listen for new messages
    socket.on("receiveMessage", (message) => {
      if (selectedChat && (selectedChat._id === message.sender || selectedChat._id === message.receiver)) {
        setMessages((prev) => [...prev, message]);
      }
      // Update conversations list
      fetchConversations();
    });

    return () => {
      socket.off("receiveMessage");
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

  return (
    <div className="fixed bottom-6 right-6 z-50">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        <MessageCircle size={24} />
      </button>

      {isOpen && (
        <div className="fixed bottom-20 right-6 bg-white w-96 h-[600px] shadow-lg rounded-lg flex flex-col">
          <div className="flex justify-between items-center bg-blue-600 text-white p-4 rounded-t-lg">
            <h2 className="text-lg font-bold">Messages</h2>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          <div className="flex h-full">
            {/* Conversations List */}
            <div className="w-1/3 border-r">
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
                  .map((user) => (
                    <div
                      key={user._id}
                      onClick={() => startNewChat(user)}
                      className={`p-3 hover:bg-gray-100 cursor-pointer ${
                        selectedChat?._id === user._id ? "bg-gray-100" : ""
                      }`}
                    >
                      <p className="font-medium">{user.username}</p>
                    </div>
                  ))}
              </div>
            </div>

            {/* Chat Window */}
            <div className="flex-1 flex flex-col">
              {selectedChat ? (
                <>
                  <div className="p-3 bg-gray-100 border-b">
                    <p className="font-medium">{selectedChat.username}</p>
                  </div>

                  <div className="flex-1 overflow-y-auto p-4">
                    {messages.map((msg, index) => (
                      <div
                        key={index}
                        className={`mb-2 flex ${
                          msg.sender._id === user._id ? "justify-end" : "justify-start"
                        }`}
                      >
                        <div
                          className={`p-2 rounded-lg max-w-[70%] ${
                            msg.sender._id === user._id
                              ? "bg-blue-600 text-white"
                              : "bg-gray-200"
                          }`}
                        >
                          <p>{msg.text}</p>
                          <span className="text-xs opacity-75">
                            {new Date(msg.createdAt).toLocaleTimeString()}
                          </span>
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