import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

function CreateThought({ onClose }) {
  const [title, setTitle] = useState("");
  const [content, setContent] = useState("");
  const [bookTitle, setBookTitle] = useState("");
  const [bookAuthor, setBookAuthor] = useState("");
  const [tags, setTags] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  
  const refreshPage = () => {
    navigate(0); // This reloads the current page
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) return;

    setLoading(true);

    const bookData = bookTitle && bookAuthor ? [{ title: bookTitle, author: bookAuthor, tags: tags.split(",").map(tag => tag.trim()) }] : [];

    try {
      const response = await fetch("http://localhost:5000/api/thoughts/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({ title, content, book: bookData }),
      });

      if (response.ok) {
        toast.success("Thought created!", {
          position: "top-right",
          autoClose: 3000, // Closes after 3 seconds
          hideProgressBar: false,
          closeOnClick: true,
          pauseOnHover: true,
          draggable: true,
          progress: undefined,
          theme: "light",
        });
        setTitle("");
        setContent("");
        setBookTitle("");
        setBookAuthor("");
        setTags("");
        onClose();
      } else {
        console.error("Error creating thought");
      }
    } catch (error) {
      console.error("Error:", error);
    }

    setLoading(false);
    //refreshPage();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-lg shadow-lg w-80">
        <h2 className="text-xl font-semibold mb-3">Create Thought</h2>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="Title"
          className="w-full border p-2 rounded mb-2"
        />
        <textarea
          value={content}
          onChange={(e) => setContent(e.target.value)}
          placeholder="What's on your mind?"
          className="w-full border p-2 rounded mb-2"
          rows="3"
        />
        
        <h3 className="text-md font-medium">Book Details (Optional)</h3>
        <input
          type="text"
          value={bookTitle}
          onChange={(e) => setBookTitle(e.target.value)}
          placeholder="Book Title"
          className="w-full border p-2 rounded mb-2"
        />
        <input
          type="text"
          value={bookAuthor}
          onChange={(e) => setBookAuthor(e.target.value)}
          placeholder="Book Author"
          className="w-full border p-2 rounded mb-2"
        />
        <input
          type="text"
          value={tags}
          onChange={(e) => setTags(e.target.value)}
          placeholder="Tags (comma-separated)"
          className="w-full border p-2 rounded mb-2"
        />

        <div className="flex justify-end mt-3">
          <button onClick={onClose} className="mr-2 px-3 py-1 bg-gray-400 text-white rounded">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-3 py-1 bg-blue-600 text-white rounded"
            disabled={loading}
          >
            {loading ? "Posting..." : "Post"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateThought;
