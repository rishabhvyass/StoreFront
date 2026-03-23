import React, { useState } from "react";
import {
  FiFacebook,
  FiInstagram,
  FiMail,
  FiMapPin,
  FiPhone,
  FiShare2,
  FiTwitter,
} from "react-icons/fi";
import "../styles/ContactPage.css";

const Contact = () => {
  const [formData, setFormData] = useState({
    firstName: "Taylor",
    lastName: "Lee",
    email: "you@yourmail.com",
    message: "",
  });
  const [newsletterEmail, setNewsletterEmail] = useState("");

  const handleChange = (event) => {
    const { name, value } = event.target;
    setFormData((current) => ({
      ...current,
      [name]: value,
    }));
  };

  const handleSubmit = (event) => {
    event.preventDefault();
  };

  return (
    <div className="contact-shell">
      <div className="contact-frame">
        <section className="contact-main-grid">
          <div className="contact-left-column">
            <article className="contact-info-card">
              <h1>Contact &amp; Support</h1>

              <div className="contact-info-grid">
                <div className="contact-info-block">
                  <div className="contact-info-label">
                    <FiPhone />
                    <span>Phone</span>
                  </div>
                  <p>+1 (800) 555-</p>
                  <p>+1 (888) 123-</p>
                </div>

                <div className="contact-info-block">
                  <div className="contact-info-label">
                    <FiMail />
                    <span>E-mail</span>
                  </div>
                  <a href="mailto:support@shopfro.com">support@shopfro.com</a>
                </div>

                <div className="contact-info-block">
                  <div className="contact-info-label">
                    <FiMapPin />
                    <span>Address</span>
                  </div>
                  <p>200 Market</p>
                  <p>Street</p>
                  <p>San Francisco,</p>
                </div>

                <div className="contact-info-block">
                  <div className="contact-info-label">
                    <FiShare2 />
                    <span>Social</span>
                  </div>
                  <div className="contact-socials">
                    <a href="/" aria-label="Instagram" onClick={(event) => event.preventDefault()}>
                      <FiInstagram />
                    </a>
                    <a href="/" aria-label="Twitter" onClick={(event) => event.preventDefault()}>
                      <FiTwitter />
                    </a>
                  </div>
                </div>
              </div>
            </article>

            <div className="contact-map-strip" aria-hidden="true" />
          </div>

          <article className="contact-form-panel">
            <h2>Contact Support</h2>

            <form onSubmit={handleSubmit}>
              <div className="contact-name-row">
                <label className="contact-field">
                  <span>First Name</span>
                  <input
                    type="text"
                    name="firstName"
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </label>

                <label className="contact-field">
                  <span>Last Name</span>
                  <input
                    type="text"
                    name="lastName"
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </label>
              </div>

              <label className="contact-field contact-field-full">
                <span>E-mail</span>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                />
              </label>

              <label className="contact-field contact-field-full">
                <span>Message</span>
                <textarea
                  name="message"
                  value={formData.message}
                  onChange={handleChange}
                  placeholder="Type your message"
                  rows="6"
                />
              </label>

              <button type="submit" className="contact-send-button">
                SEND
              </button>
            </form>
          </article>
        </section>

        <section className="contact-newsletter-bar">
          <p>Join our newsletter for launch offers.</p>

          <form
            className="contact-newsletter-form"
            onSubmit={(event) => event.preventDefault()}
          >
            <input
              type="email"
              value={newsletterEmail}
              onChange={(event) => setNewsletterEmail(event.target.value)}
              placeholder="Enter your email"
            />
            <button type="submit">SUBSCRIBE</button>
          </form>
        </section>

        <footer className="contact-footer">
          <div className="contact-footer-brand">
            <h3>ShopFront</h3>
            <div className="contact-footer-socials">
              <a href="/" aria-label="Facebook" onClick={(event) => event.preventDefault()}>
                <FiFacebook />
              </a>
              <a href="/" aria-label="Twitter" onClick={(event) => event.preventDefault()}>
                <FiTwitter />
              </a>
              <a href="/" aria-label="Instagram" onClick={(event) => event.preventDefault()}>
                <FiInstagram />
              </a>
            </div>
          </div>

          <div className="contact-footer-links">
            <div>
              <h4>Help</h4>
              <a href="/" onClick={(event) => event.preventDefault()}>FAQ</a>
              <a href="/" onClick={(event) => event.preventDefault()}>Customer Service</a>
              <a href="/" onClick={(event) => event.preventDefault()}>How-to guides</a>
            </div>

            <div>
              <h4>Support</h4>
              <a href="/" onClick={(event) => event.preventDefault()}>Privacy Policy</a>
              <a href="/" onClick={(event) => event.preventDefault()}>Sitemap</a>
              <a href="/" onClick={(event) => event.preventDefault()}>Subscriptions</a>
            </div>

            <div>
              <h4>Contact us</h4>
              <a href="mailto:support@shopfront.com">support@shopfront</a>
              <a href="tel:+18005550123">+1 (800) 555-0123</a>
            </div>
          </div>
        </footer>
      </div>
    </div>
  );
};

export default Contact;
