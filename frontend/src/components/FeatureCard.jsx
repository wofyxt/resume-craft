const FeatureCard = ({ icon, title, desc }) => {
  return (
    <div className="feature-card">
      <div className="feature-icon">
        <i className={icon}></i>
      </div>
      <h3>{title}</h3>
      <p>{desc}</p>
    </div>
  );
};

export default FeatureCard;