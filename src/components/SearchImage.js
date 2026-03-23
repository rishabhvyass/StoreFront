import React, { useState } from "react";

const ImageSearch = () => {
  const [query, setQuery] = useState("");
  const [images, setImages] = useState([]);
  const accessKey = "12YruGc2QFjleaEClOGNiMyJnPkrAMKLFYMZds7gfC8"; // Replace with your Unsplash access key

  const handleSearch = async (event) => {
    event.preventDefault(); // Prevent the default form submission behavior

    const response = await fetch(
      `https://api.unsplash.com/search/photos?query=${query}&client_id=${accessKey}`
    );
    const data = await response.json();
    setImages(data.results); // Set the images from the response
  };

  return (
    <div className="search_box">
      <form onSubmit={handleSearch}>
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search for an image..."
        />
        <button type="submit" className="Search_btn">Search</button>
      </form>
      <div style={{ display: "flex", flexWrap: "wrap", marginTop: "20px" }}>
        {images.map((image) => (
          <div key={image.id} style={{ margin: "10px" }}>
            <img
              src={image.urls.small}
              alt={image.description}
              style={{ width: "200px", height: "200px", borderRadius: "8px" }}
            />
          </div>
        ))}
      </div>
    </div>
  );
};

export default ImageSearch;
