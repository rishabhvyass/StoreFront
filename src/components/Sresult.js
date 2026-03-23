import React, { useEffect, useState } from "react";
const Sresult = ({query}) => {
  const [image, setImage] = useState("");
  const accessKey = "12YruGc2QFjleaEClOGNiMyJnPkrAMKLFYMZds7gfC8";

  useEffect(
    () => {
      const fetchRandomImage = async () => {
        try {
          const response = await fetch(
            `https://api.unsplash.com/photos/random?${query}&client_id=${accessKey}`
          );
          const data = await response.json();
          setImage(data?.urls?.regular);
        } catch (error) {
          console.error("Error fetching the image:", error);
        }
      };
      fetchRandomImage();
    },
    [accessKey]
  );
  return (
    <div>
      {image ? (
        <img
          src={image}
          alt="loading...."
          style={{ marginTop: "20px", width: "30%", height: "20%" }}
        />
      ) : (
        <p> error image</p>
      )}
    </div>
  );
};

export default Sresult;
