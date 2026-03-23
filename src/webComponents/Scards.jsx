import React from "react";
import { NavLink } from "react-router-dom";

const Scards = ({ title, text, imgsrc }) => {
  return (
    <>
      <div className="service-card-wrapper">
        <div className="card">
          <img src={imgsrc} className="card-img-top" alt={title} />
          <div className="card-body">
            <h5 className="card-title">{title}</h5>
            <p className="card-text">{text}</p>
            <NavLink to="#" className="btn btn-outline-dark">
              Read More
            </NavLink>
          </div>
        </div>
      </div>
    </>
  );
};

export default Scards;
