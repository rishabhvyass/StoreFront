import React, { useState } from "react";
import Sresult from "./Sresult";

const Search = () => {
  const [img, setImg] = useState("");
  const Searching = (event) => {
    const data = event.target.value;
    setImg(data);
  };
  return (
    <>
      <div className="search_box">
        <input
          type="text"
          placeholder="Search of image"
          value={img}
          onChange={Searching}
        ></input>
        {img === "" ? null : <Sresult query={img} />}
      </div>
    </>
  );
};
export default Search;
