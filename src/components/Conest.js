import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
const Conest = () => {
  const [num, setNum] = useState(1);
  const [name, setName] = useState([]);
  const [pokedata, setPokedata] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await axios.get(`https://pokeapi.co/api/v2/type/`);
        if (response.data?.results?.length > 0) {
          setPokedata(response.data?.results);
        } else {
          setPokedata([]);
        }
        // setName(response.data.name);
        // if (response.data.moves) {
        // Extract move names if moves exist
        //   setMoves(response.data.moves.map((move) => move.name));
        // } else {
        // If no moves property exists, set moves to an empty array
        // setMoves([]);
        // }
      } catch (error) {
        console.error("Error fetching data:", error);
      }
    };

    fetchData();
  }, []);

  useEffect(() => {
    const fetchName = async () => {
      try {
        const response = await axios.get(
          `https://pokeapi.co/api/v2/type/${num}`
        );
        console.log(" calling data ", response.data?.name);
        setName(response.data?.name);
      } catch (error) {
        console.log("error", error);
      }
    };
    fetchName();
  }, [num]);
  return (
    <>
      <h1 style={{ textAlign: "center", fontSize: "40px" }}>
        Picked <span style={{ color: "red" }}> {num} Pokemon </span>
      </h1>
      <h1 style={{ textAlign: "center", fontSize: "40px" }}>
        My name is <span style={{ color: "red" }}> {name}</span>
      </h1>
      {/* <h1 style={{ textAlign: "center", fontSize: "40px" }}>
        I have <span style={{ color: "red" }}> {moves.length} Moves</span>
      </h1> */}

      <select
        style={{ fontSize: "50px", marginLeft: "48%" }}
        value={num}
        onChange={(event) => {
          setNum(event.target.value);
        }}
      >
        {Array(pokedata?.length)
          .fill()
          .map((_, index) => {
            return (
              <option key={index} value={index + 1}>
                {index + 1}
              </option>
            );
          })}
      </select>
    </>
  );
};
export default Conest;
