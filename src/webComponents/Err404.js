import React from "react";
import { NavLink } from "react-router-dom";
import Error from "../images/undraw_page_not_found_re_e9o6.svg";
import "../styles/ErrorPage.css";

const Err404 = () => {
  return (
    <section className="error-shell">
      <div className="error-frame">
        <img src={Error} alt="Page not found" className="error-image" />
        <p className="error-kicker">404 error</p>
        <h1>Oops Page Not Found</h1>
        <p className="error-copy">
          The page you opened is missing or the link is no longer available.
          Let&apos;s take you back to the storefront.
        </p>
        <div className="error-actions">
          <NavLink to="/" type="button" className="error-home-button">
            Go Home
          </NavLink>
        </div>
      </div>
    </section>
  );
};

export default Err404;
