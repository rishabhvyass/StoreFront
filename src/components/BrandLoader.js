import React from 'react';

const BrandLoader = ({ message = 'Loading...', compact = false }) => {
  return (
    <div className={`brand-loader${compact ? ' brand-loader-compact' : ''}`}>
      <div className="brand-loader-card">
        <div className="brand-loader-spinner" aria-hidden="true">
          <span className="brand-loader-ring brand-loader-ring-one" />
          <span className="brand-loader-ring brand-loader-ring-two" />
          <span className="brand-loader-core" />
        </div>
        <p>{message}</p>
      </div>
    </div>
  );
};

export default BrandLoader;
