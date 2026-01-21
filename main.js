import './style.css'

const scanButton = document.getElementById("scanButton");
const statusIcon = document.getElementById("statusIcon");
const logElement = document.getElementById("log");
const statusSvg = statusIcon.querySelector("svg");

// Icons
const ICON_DEFAULT = `<path stroke-linecap="round" stroke-linejoin="round" d="M12.75 19.5v-.75a7.5 7.5 0 00-7.5-7.5H4.5m0-6.75h.75c7.87 0 14.25 6.38 14.25 14.25v.75M6 18.75a.75.75 0 11-1.5 0 .75.75 0 011.5 0z" />`;
const ICON_SCANNING = `<path stroke-linecap="round" stroke-linejoin="round" d="M9.348 14.651a3.75 3.75 0 010-5.303m5.304 0a3.75 3.75 0 010 5.303m-7.425 2.122a6.75 6.75 0 010-9.546m9.546 0a6.75 6.75 0 010 9.546M5.106 18.894c-3.808-3.808-3.808-9.98 0-13.788m13.788 0c3.808 3.808 3.808 9.98 0 13.788M12 12h.008v.008H12V12z" />`;
const ICON_SUCCESS = `<path stroke-linecap="round" stroke-linejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />`;
const ICON_ERROR = `<path stroke-linecap="round" stroke-linejoin="round" d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z" />`;

function setStatus(state, message) {
  logElement.classList.remove("hidden");
  logElement.textContent = message;
  
  // Reset classes
  statusIcon.className = "status-icon";
  
  if (state === "scanning") {
    statusIcon.classList.add("scanning");
    statusSvg.innerHTML = ICON_SCANNING;
    scanButton.disabled = true;
    scanButton.textContent = "Scanning...";
  } else if (state === "success") {
    statusIcon.classList.add("success");
    statusSvg.innerHTML = ICON_SUCCESS;
    scanButton.disabled = false;
    scanButton.textContent = "Scan Again";
    if (navigator.vibrate) navigator.vibrate(200);
  } else if (state === "error") {
    statusIcon.classList.add("error");
    statusSvg.innerHTML = ICON_ERROR;
    scanButton.disabled = false;
    scanButton.textContent = "Retry";
    if (navigator.vibrate) navigator.vibrate([100, 50, 100]);
  } else {
    statusSvg.innerHTML = ICON_DEFAULT;
    scanButton.disabled = false;
    scanButton.textContent = "Start Scan";
  }
}

scanButton.addEventListener("click", async () => {
  setStatus("scanning", "Hold device near card...");

  try {
    if (!("NDEFReader" in window)) {
      throw new Error("NFC not supported on this device.");
    }

    const ndef = new NDEFReader();
    await ndef.scan();

    ndef.addEventListener("readingerror", () => {
      setStatus("error", "Read failed. Try again.");
    });

    ndef.addEventListener("reading", ({ message, serialNumber }) => {
      console.log("Reading:", message, serialNumber);
      setStatus("success", `Card Detected!\nID: ${serialNumber}`);
    });

  } catch (error) {
    setStatus("error", error.message);
  }
});
