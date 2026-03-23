import React from "react";

import { NavLink } from "react-router-dom";
const Common = ({ header , Boldtext , para , btnname ,visit , imgsrc}) => {
  return (
    <>
      <section id="header" className=" d-flex align-items-center">
        <div className="container-fluid nav_bg">
          <div className="row">
            <div className=" col-10 mx-auto ">
              <div className="row">
                <div className="col-md-6 pt-5 pt-lg-0 order-2 order-lg-1 d-flex justify-content-center flex-column container">
                  <h1>
                    {header}
                    <strong className="brand-name"> {Boldtext} </strong>
                  </h1>
                  <h2 className="my-3">
                   {para}
                  </h2>
                  <div className="mt-3">
                    <NavLink to={visit} className="btn btn-outline-dark">
                     {btnname}
                    </NavLink>
                  </div>
                </div>
                <div className="col-lg-6 order-1 order-lg-2 header-img">
                  <img
                    src={imgsrc}
                    className="image-fluid animated"
                    alt="home img"
                  />
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </>
  );
};

export default Common;
