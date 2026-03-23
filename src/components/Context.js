import React, { useEffect, useState } from "react";
const Context = () => {
  const [num, setNum] = useState(0);
  const [nums, setNums] = useState(0);

  useEffect(() => {
    document.title = `you clicked me ${nums} times `;
  }, [nums]);
  return (
    <>
      <button
        onClick={() => {
          setNum(num + 1);
        }}
        style={{ fontSize: "100px" }}
      >
        Clicke me {num}
      </button>
      <br />
      <button
        onClick={() => {
          setNums(nums + 1);
        }}
        style={{ fontSize: "100px" }}
      >
        Clicke me {nums}
      </button>
    </>
  );
};

export default Context;

// CreateContext ()

// provider

// consumer
