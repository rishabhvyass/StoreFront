import React from "react";
import Common from "./Common";
import web from "../images/undraw_about_us_page_re_2jfm (1).svg";
const About = () => {
  return (
    <>
      <Common
        header="What's Your Query"
        imgsrc={web}
        Boldtext="About FAQ"
        visit="/Contact"
        para=" This website gives you the better lifestyle in any field"
        btnname="Contact us "
      />
    </>
  );
};

export default About;
