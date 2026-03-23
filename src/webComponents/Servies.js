import React from "react";
import Scards from "./Scards";
import CardsDetails from "./CardsDetails";

const Services = () => {
  return (
    <>
      <h1 className="Services-title"> Our Services </h1>

      <div className="Card_Container">
        {CardsDetails.map((e) => {
          return (
            <div key={e}>
              <Scards title={e.title} text={e.text} imgsrc={e.imgsrc} />
            </div>
          );
        })}
      </div>
    </>
  );
};

export default Services;
