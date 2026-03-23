import React from "react";
import { NavLink } from "react-router-dom";

const NotFound = () => {
  return (
    <>
      <div className="Home">
        <h1 className="Welcome_text"> 404 Error! </h1>
        <p className="para"> Oops Page Not Found </p>
        <NavLink to="/" className="Previous_btn"> Go Home </NavLink>
      </div>
    </>
  );
};

export default NotFound;
