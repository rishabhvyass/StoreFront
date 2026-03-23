import React from "react";
import { useLocation, useParams, useNavigate } from "react-router-dom";

const Dashboard = () => {
  const { fname, lname } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  return (
    <>
      <div className="Home">
        <h1  className="Welcome_text">
          Welcome,! {fname} {lname}
        </h1>
        <p>My current location {location?.pathname}</p>
        {location.pathname === `/Dashboard/Rishabh/vyas` ? (
          <button className="Previous_btn"
            onClick={() => {
              navigate(-1);
            }}
          >
            Previous Page
          </button>
        ) : null}
      </div>
    </>
  );
};

export default Dashboard;
