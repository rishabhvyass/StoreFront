import React from "react";

const FormDetails = ({ email, fname, lname, Phone, Query, imagesrc }) => {
  return (
    <>
      <div className="mb-3 form-conatiner">
        <label htmlFor="firstName" className="form-label">
          {fname}
        </label>
        <input
          type="text"
          className="form-control"
          id="firstName"
          placeholder="John"
        />
      </div>
      <div className="mb-3 form-conatiner">
        <label htmlFor="lastName" className="form-label">
          {lname}
        </label>
        <input
          type="text"
          className="form-control"
          id="lastName"
          placeholder="Jacob"
        />
      </div>
      <div className="mb-3 form-conatiner">
        <label htmlFor="emailAddress" className="form-label">
          {email}
        </label>
        <input
          type="email"
          className="form-control"
          id="emailAddress"
          placeholder="name@example.com"
        />
      </div>
      <div className="mb-3 form-conatiner">
        <label htmlFor="phoneNumber" className="form-label">
          {Phone}
        </label>
        <input
          type="tel"
          className="form-control"
          id="phoneNumber"
          placeholder="+91 1010101010"
        />
      </div>
      <div className="mb-3 form-conatiner">
        <label htmlFor="queryText" className="form-label">
          {Query}
        </label>
        <textarea
          className="form-control"
          id="queryText"
          rows="4"
          placeholder="Describe your query in detail..."
        ></textarea>
        <input
          className="btn btn-primary submit-btn"
          type="submit"
          value="Submit"
        />
      </div>
    </>
  );
};

export default FormDetails;
