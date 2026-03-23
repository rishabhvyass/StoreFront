import React, { useEffect, useState } from "react";
import axios from "axios";

const API = "https://pokeapi.co/api/v2/type/";

const Api = () => {
  const [show, setShow] = useState([]);

  useEffect(() => {
    const featchApiData = async () => {
      try {
        const res = await axios.get(API);
        console.log(res?.data.results);
        setShow(res?.data?.results);
      } catch (error) {
        console.log("error sometimes", error);
      }
    };
    featchApiData();
  }, []);
  return (
    <>
      <h1> hi this is rishabh vyas </h1>
      {show?.map((pokemone) => {
        const { name, url } = pokemone;
        return (
          <div key={name}>
            <h1>{name}</h1>
            <p>{url}</p>
          </div>
        );
      })}
    </>
  );
};

export default Api;
