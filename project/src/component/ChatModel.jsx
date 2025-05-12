import { useEffect, useState } from "react";
import { io } from "socket.io-client";
import { MessageCircle, X } from "lucide-react";

const socket = io("http://localhost:5000/");

const ChatModel = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState("");

  useEffect(() => {
    // Listen for incoming messages
    socket.on("receiveMessage", (message) => {
      setMessages((prevMessages) => [...prevMessages, message]);
    });

    return () => {
      socket.off("receiveMessage");
    };
  }, []);

  // Handle sending a message
  const sendMessage = () => {
    if (newMessage.trim() !== "") {
      const messageData = {
        text: newMessage,
        timestamp: new Date().toISOString(),
      };
      socket.emit("sendMessage", messageData);
      setMessages((prevMessages) => [...prevMessages, messageData]);
      setNewMessage("");
    }
  };

  return (
    <div className="fixed bottom-6 left-6 z-50">
      {/* Button to open chat */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition"
      >
        <MessageCircle size={24} />
      </button>

      {/* Chat Sidebar */}
      {isOpen && (
        <div className="fixed bottom-16 left-6 bg-white w-80 h-96 shadow-lg rounded-lg flex flex-col">
          {/* Header */}
          <div className="flex justify-between items-center bg-blue-600 text-white p-3 rounded-t-lg">
            <h2 className="text-lg font-bold">Messages</h2>
            <button onClick={() => setIsOpen(false)}>
              <X size={20} />
            </button>
          </div>

          {/* Messages List */}
          <div className="flex-1 overflow-y-auto p-3">
            {messages.length > 0 ? (
              messages.map((msg, index) => (
                <div key={index} className="mb-2">
                  <p className="bg-gray-200 p-2 rounded-md">{msg.text}</p>
                  <span className="text-xs text-gray-500">
                    {new Date(msg.timestamp).toLocaleTimeString()}
                  </span>
                </div>
              ))
            ) : (
              <p className="text-gray-500 text-center mt-10">No messages yet</p>
            )}
          </div>

          {/* Input Box */}
          <div className="p-3 border-t">
            <div className="flex">
              <input
                type="text"
                className="w-full p-2 border rounded-md"
                placeholder="Type a message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && sendMessage()}
              />
              <button
                onClick={sendMessage}
                className="bg-blue-600 text-white px-4 py-2 ml-2 rounded-md hover:bg-blue-700 transition"
              >
                Send
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ChatModel;
