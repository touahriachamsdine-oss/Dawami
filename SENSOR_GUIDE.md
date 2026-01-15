# ESP32 Sensor Code Update Required

To enable the new **"Scan Finger"** button on the website, you must update your ESP32 code to "listen" for enrollment commands from the website.

## How it works
1. **Website**: You click "Scan" -> Server sets `command: "ENROLL"`.
2. **ESP32**: Sends update -> Server replies `{"command": "ENROLL", "targetId": 123}`.
3. **ESP32**: Sees command -> Enters Enrollment Mode -> Scans Finger -> Saves it.
4. **ESP32**: Sends `{"status": "ENROLL_SUCCESS"}` -> Website shows "Finished".

## Updated Arduino Loop Code (Example)

Replace your `loop()` function with logic similar to this:

```cpp
void loop() {
  if (WiFi.status() == WL_CONNECTED) {
    HTTPClient http;
    http.begin(serverUrl); // e.g. http://your-app.com/api/sensor/update
    http.addHeader("Content-Type", "application/json");

    // Send current status
    String payload = "{\"secret\": \"" + String(secret) + "\", \"status\": \"Online\", \"message\": \"Ready\"}";
    int httpResponseCode = http.POST(payload);

    if (httpResponseCode > 0) {
      String response = http.getString();
      // Parse JSON response to check for commands
      // You need ArduinoJson library
      StaticJsonDocument<512> doc;
      deserializeJson(doc, response);

      const char* command = doc["command"]; // "ENROLL" or "IDLE"
      
      if (strcmp(command, "ENROLL") == 0) {
         int targetId = doc["targetId"];
         Serial.println("Starting Enrollment for ID: " + String(targetId));
         
         // CALL YOUR ENROLL FUNCTION HERE
         // bool success = enrollFinger(targetId);
         
         // REPORT BACK
         // if (success) sendUpdate("ENROLL_SUCCESS", "Finger enrolled!");
         // else sendUpdate("ENROLL_FAILED", "Could not enroll.");
      }
    }
    http.end();
  }
  delay(2000); // Check every 2 seconds
}
```

## Important
- You must include `ArduinoJson` library in your Arduino IDE.
- You need to implement the `enrollFinger(id)` function using the Adafruit Fingerprint library examples.
