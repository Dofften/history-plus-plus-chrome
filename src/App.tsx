import { useEffect, useState } from "react";
import Banner from "./components/Banner";
import { claude } from "./styles/Theme";
import "./styles/App.css";
import HistoryTable from "./components/HistoryTable";

export default function App() {
  const [currentWindow, setCurrentWindow] = useState(null as any);
  useEffect(() => {
    const setWindowState = async () => {
      const thisWindow = await chrome.windows.getCurrent();
      setCurrentWindow(thisWindow);
    };
    setWindowState();
  }, []);

  const popupWidth = Math.min(
    600,
    currentWindow !== null ? currentWindow.width * 0.5 : 600
  );
  const popupHeight = Math.min(
    600,
    currentWindow !== null ? currentWindow.height * 0.5 : 600
  );
  return (
    <div
      style={{
        width: popupWidth,
        height: popupHeight,
        backgroundColor: claude,
        flexDirection: "column",
      }}
    >
      <Banner />
      <HistoryTable />
    </div>
  );
}
