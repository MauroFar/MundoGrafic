import React from "react";

const Welcome = ({ title, message }) => {
  return (
    <div className="bg-gray-100 p-4 rounded-lg shadow-lg">
      <h2 className="text-xl font-bold mb-2">{title}</h2>
      <p>{message}</p>
    </div>
  );
};

export default Welcome;
