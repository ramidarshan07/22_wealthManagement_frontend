import { useEffect } from "react";
import "./ClickWave.css";

const ClickWave = () => {
  useEffect(() => {
    const handleGlobalClick = (e) => {
      const wave = document.createElement("div");
      wave.className = "click-wave";
      wave.style.left = `${e.clientX}px`;
      wave.style.top = `${e.clientY}px`;

      document.body.appendChild(wave);

      // Clean up the DOM element after animation ends
      wave.addEventListener("animationend", () => {
        wave.remove();
      });
    };

    // Add event listener to the window
    window.addEventListener("click", handleGlobalClick);

    // Cleanup
    return () => {
      window.removeEventListener("click", handleGlobalClick);
    };
  }, []);

  return null;
};

export default ClickWave;
