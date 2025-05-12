import React, { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import ThoughtCard from "../component/Thoughtcard";

const SearchPage = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const [searchResults, setSearchResults] = useState([]);
  const [query, setQuery] = useState("");

  useEffect(() => {
    const params = new URLSearchParams(location.search);
    const searchQuery = params.get("q") || "";
    setQuery(searchQuery);
  
    if (searchQuery?.trim()) {
      console.log("Sending search request to:", `http://localhost:5000/api/thoughts/search?q=${searchQuery}`);
  
      fetch(`http://localhost:5000/api/thoughts/search?q=${searchQuery}`)
        .then((res) => res.json())
        .then((data) => {
          console.log("Search results received:", data);
          setSearchResults(data);
        })
        .catch((error) => console.error("Error fetching search results:", error));
    } else {
      console.log("Search query is empty");
      setSearchResults([]);
    }
  }, [location.search]);
  

  const handleSearchChange = (e) => {
    setQuery(e.target.value);
  };

  const handleSearchSubmit = (e) => {
    e.preventDefault();
    navigate(`/search?q=${query}`);
  };

  


  return (
    <div className="container  mx-auto p-6">
      <h2 className="text-2xl  pt-20 font-bold mb-4">Search Results</h2>
      
      {searchResults.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4 mb-20">
          {searchResults.map((thought) => (
            <ThoughtCard key={thought._id} thought={thought} userId={localStorage.getItem("userId")} />
          ))}
        </div>
      ) : (
        <p>No results found.</p>
      )}
    </div>
  );
};

export default SearchPage;
