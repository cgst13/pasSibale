# NFC Reader (Mobile Web)

A simple web application to read NFC tags using Chrome on Android.

## Requirements

1.  **Android Phone** with NFC enabled.
2.  **Chrome Browser** (Version 89+).
3.  **HTTPS** (or localhost).

## How to Run

1.  Start the development server:
    ```bash
    npm run dev
    ```

2.  **To test on your phone:**
    *   Ensure your phone and computer are on the **same Wi-Fi**.
    *   Look at the terminal output for the "Network" URL (e.g., `http://192.168.1.5:5173`).
    *   Open that URL in **Chrome on Android**.
    *   Tap **"Start Scan"**.
    *   Allow the permission prompt.
    *   Touch an NFC card to the back of your phone.

## Troubleshooting
*   **"NFC is not supported"**: Make sure you are using Chrome on Android. It does not work on iOS or Desktop.
*   **Permission Denied**: You must click "Allow" when the browser asks for NFC access.
*   **Not Scanning**: Move the card slowly around the back of the phone (the antenna is usually near the camera).
