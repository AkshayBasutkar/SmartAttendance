# Arduino ESP32 RFID Scanner Setup Guide

## Overview

The `sketch.ino` file contains the Arduino code that runs on an ESP32 microcontroller with an MFRC522 RFID reader module. This code enables contactless attendance tracking by reading RFID cards and sending the unique IDs to the Python backend via serial communication.

## Hardware Components

### Required Components

1. **ESP32 Development Board**
   - Any ESP32 board with SPI pins available
   - Recommended: ESP32 DevKit V1 or NodeMCU-32S
   - Operating voltage: 3.3V

2. **MFRC522 RFID Reader Module**
   - Operating frequency: 13.56 MHz
   - Communication protocol: SPI
   - Operating voltage: 3.3V
   - Read distance: 0-60mm (depending on tag type)

3. **RFID Cards/Tags**
   - Compatible with ISO/IEC 14443 Type A
   - Common types: MIFARE Classic 1K, MIFARE Ultralight
   - Each student should have a unique RFID card

4. **LED (Optional)**
   - Used for visual feedback when a card is scanned
   - Any standard LED (3mm or 5mm)
   - Color: Any (green recommended for "scan successful")

5. **Resistor for LED**
   - 220Ω or 330Ω resistor (for LED current limiting)

6. **Jumper Wires**
   - Male-to-female jumper wires for connections

7. **USB Cable**
   - Micro-USB or USB-C (depending on your ESP32 board)
   - For programming and serial communication

## Pin Connections

### MFRC522 to ESP32 Wiring Diagram

```
MFRC522 Pin    →    ESP32 Pin    →    Description
-----------         ---------         ------------
SDA (SS)       →    GPIO 5            Chip Select (Slave Select)
SCK            →    GPIO 18           SPI Clock (default)
MOSI           →    GPIO 23           Master Out Slave In (default)
MISO           →    GPIO 19           Master In Slave Out (default)
IRQ            →    Not Connected     Interrupt (not used)
GND            →    GND               Ground
RST            →    GPIO 22           Reset
3.3V           →    3.3V              Power Supply
```

### LED Connection (Optional)

```
LED Pin        →    ESP32 Pin         →    Description
-----------         ---------              ------------
Anode (+)      →    GPIO 2 → 220Ω → LED   Scan Indicator LED
Cathode (-)    →    GND                    Ground
```

### Visual Wiring Diagram

```
         ESP32                           MFRC522
    ┌──────────────┐                ┌──────────────┐
    │              │                │              │
    │      GPIO 5  ├────────────────┤ SDA          │
    │     GPIO 18  ├────────────────┤ SCK          │
    │     GPIO 23  ├────────────────┤ MOSI         │
    │     GPIO 19  ├────────────────┤ MISO         │
    │     GPIO 22  ├────────────────┤ RST          │
    │         3.3V ├────────────────┤ 3.3V         │
    │          GND ├────────────────┤ GND          │
    │              │                │              │
    │      GPIO 2  ├───[220Ω]───[LED]──┬          │
    │          GND ├───────────────────┘          │
    │              │                               │
    └──────────────┘                ┌──────────────┘
                                    │
                              [RFID Cards/Tags]
```

## Code Explanation

### Complete Code Breakdown

```cpp
#include <SPI.h>
#include <MFRC522.h>
```
**Purpose:** Include required libraries
- `SPI.h`: Built-in Arduino library for SPI communication
- `MFRC522.h`: Library for interfacing with the MFRC522 RFID reader
  - Install via Arduino Library Manager: "MFRC522 by GithubCommunity"

---

```cpp
// Define the RC522 pins
#define RST_PIN   22
#define SS_PIN    5
```
**Purpose:** Define which ESP32 pins connect to the RFID reader
- `RST_PIN`: Reset pin for the MFRC522 module
- `SS_PIN`: Slave Select (chip select) pin for SPI communication
- **Note:** You can change these pins if needed, but ensure they don't conflict with other peripherals

---

```cpp
// Define the pin for the "Scan" indicator LED
#define SCAN_LED_PIN  2
```
**Purpose:** Define the GPIO pin connected to the scan indicator LED
- `GPIO 2`: Built-in LED on many ESP32 boards
- This LED flashes when a card is successfully scanned

---

```cpp
// Create an MFRC522 instance
MFRC522 mfrc522(SS_PIN, RST_PIN);
```
**Purpose:** Initialize the MFRC522 library with the specified pins
- Creates an object named `mfrc522` that we'll use to communicate with the reader

---

```cpp
void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
```
**Purpose:** Initialize hardware on startup
- `Serial.begin(115200)`: Opens serial communication at 115200 baud rate
  - This matches the baud rate in `rfid_scanner.py`
  - Higher baud rate = faster communication
- `SPI.begin()`: Initializes the SPI bus
- `mfrc522.PCD_Init()`: Initializes the MFRC522 reader

---

```cpp
  // Set up the LED pin as an output and turn it off
  pinMode(SCAN_LED_PIN, OUTPUT);
  digitalWrite(SCAN_LED_PIN, HIGH);
```
**Purpose:** Configure and initialize the scan indicator LED
- `pinMode()`: Sets GPIO 2 as an output pin
- `digitalWrite(HIGH)`: Turns LED OFF initially
  - Note: GPIO 2 is active-LOW on most ESP32 boards (HIGH = OFF, LOW = ON)

---

```cpp
  delay(500);
}
```
**Purpose:** Small delay to allow serial port to stabilize
- Helps ensure Python script can connect before data starts flowing

---

```cpp
void loop() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }
```
**Purpose:** Main loop - constantly checks for RFID cards
- `PICC_IsNewCardPresent()`: Returns true if a new card is near the reader
- `PICC_ReadCardSerial()`: Reads the card's unique ID (UID)
- If no card detected → return immediately and check again
- This loop runs continuously at high speed

---

```cpp
  // A card is found
  String uidString = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uidString.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " "));
    uidString.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  uidString.trim();
```
**Purpose:** Convert the card's UID bytes to a readable string
- RFID UIDs are typically 4, 7, or 10 bytes
- Each byte is converted to hexadecimal format
- Adds a leading "0" for bytes less than 0x10 (for consistent formatting)
- Example output: `"4A 2B 81 3D"`
- `trim()`: Removes leading/trailing spaces

**Example:**
- Raw UID bytes: `[0x4A, 0x2B, 0x81, 0x3D]`
- Formatted string: `"4A 2B 81 3D"`

---

```cpp
  // 1. Send the UID over serial
  Serial.println(uidString);
```
**Purpose:** Send the card UID to the Python script
- `Serial.println()`: Sends the UID string followed by a newline character
- Python script (`rfid_scanner.py`) reads this data
- The Python script then looks up the student and logs them in/out

---

```cpp
  // 2. Flash the scan LED to show it was sent
  digitalWrite(SCAN_LED_PIN, LOW);
  delay(100);
  digitalWrite(SCAN_LED_PIN, HIGH);
```
**Purpose:** Provide visual feedback that a card was scanned
- Turns LED ON (LOW = ON for active-LOW GPIO)
- Waits 100ms (0.1 seconds)
- Turns LED OFF (HIGH = OFF)
- This creates a brief flash visible to the user

---

```cpp
  // Halt the tag
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();
```
**Purpose:** Properly close communication with the card
- `PICC_HaltA()`: Tells the card to go into halt state (stop responding)
- `PCD_StopCrypto1()`: Stops encryption/authentication
- This ensures clean communication and prevents errors

---

```cpp
  delay(500); // Prevent spamming
}
```
**Purpose:** Wait 500ms before allowing another scan
- Prevents reading the same card multiple times in quick succession
- Gives user time to move their card away
- Adjust this value if needed (lower = more sensitive, higher = less sensitive)

---

## How the Code Works: Step-by-Step Flow

1. **Power On / Reset**
   - ESP32 boots up
   - `setup()` function runs once
   - Serial communication, SPI, and RFID reader are initialized
   - LED turns off (ready state)

2. **Waiting for Card**
   - `loop()` function runs continuously
   - ESP32 constantly checks if a card is nearby
   - If no card → immediately return and check again

3. **Card Detected**
   - When a card comes within range (0-60mm):
     - RFID reader detects the card's electromagnetic field
     - Reader sends a wake-up signal to the card
     - Card responds with its UID (unique identifier)

4. **Reading UID**
   - ESP32 reads the UID bytes from the RFID reader
   - Converts bytes to hexadecimal string format
   - Example: `[4A, 2B, 81, 3D]` → `"4A 2B 81 3D"`

5. **Sending Data**
   - UID string is sent via serial port to computer
   - Python script receives this data
   - LED flashes briefly for visual confirmation

6. **Card Halt**
   - Communication with the card is properly closed
   - Prevents accidental re-reads

7. **Cooldown Period**
   - Waits 500ms before accepting another card
   - Then returns to "Waiting for Card" state

## Installation and Setup

### Step 1: Install Arduino IDE

1. Download Arduino IDE from [arduino.cc/software](https://www.arduino.cc/en/software)
2. Install the appropriate version for your operating system

### Step 2: Install ESP32 Board Support

1. Open Arduino IDE
2. Go to **File → Preferences**
3. Add this URL to "Additional Board Manager URLs":
   ```
   https://raw.githubusercontent.com/espressif/arduino-esp32/gh-pages/package_esp32_index.json
   ```
4. Go to **Tools → Board → Boards Manager**
5. Search for "esp32"
6. Install "esp32 by Espressif Systems"

### Step 3: Install Required Libraries

1. Go to **Sketch → Include Library → Manage Libraries**
2. Search for "MFRC522"
3. Install "MFRC522 by GithubCommunity" (version 1.4.10 or later)

### Step 4: Configure Board Settings

1. Connect your ESP32 to the computer via USB
2. Go to **Tools → Board** and select your ESP32 board
   - Common option: "ESP32 Dev Module"
3. Go to **Tools → Port** and select the appropriate COM port
   - Windows: COM3, COM4, COM7, etc.
   - macOS: /dev/cu.usbserial-*
   - Linux: /dev/ttyUSB0 or /dev/ttyACM0

### Step 5: Upload the Code

1. Open `sketch.ino` in Arduino IDE
2. Verify the pin definitions match your wiring
3. Click **Verify** (checkmark icon) to compile
4. Click **Upload** (arrow icon) to upload to ESP32
5. Wait for "Done uploading" message

### Step 6: Verify Operation

1. Open **Tools → Serial Monitor**
2. Set baud rate to **115200**
3. Hold an RFID card near the reader
4. You should see the card's UID appear in the Serial Monitor
   - Example: `4A 2B 81 3D`
5. The LED should flash briefly when a card is scanned

## Troubleshooting

### Problem: "No such device" or "Port not found"

**Solution:**
- Install USB-to-Serial drivers for your ESP32
- For most ESP32 boards: CP2102 or CH340 drivers
- Check Device Manager (Windows) or `ls /dev/tty*` (Linux/macOS)

### Problem: LED doesn't flash

**Solution:**
- Check LED polarity (longer leg = anode/positive)
- Verify GPIO 2 connection
- Try changing LED to active-HIGH logic:
  ```cpp
  digitalWrite(SCAN_LED_PIN, HIGH);  // Turn ON
  delay(100);
  digitalWrite(SCAN_LED_PIN, LOW);   // Turn OFF
  ```

### Problem: No cards detected

**Solution:**
- Check all wiring connections (especially GND, 3.3V, SDA)
- Verify MFRC522 power LED is lit
- Try moving card closer (within 2-3cm)
- Check if MFRC522 is properly powered (some boards need more current)

### Problem: "Compilation error: 'MFRC522' was not declared"

**Solution:**
- Install the MFRC522 library via Library Manager
- Restart Arduino IDE after installation

### Problem: Garbage characters in Serial Monitor

**Solution:**
- Ensure baud rate is set to 115200 in both code and Serial Monitor
- Check that correct COM port is selected

### Problem: Card reads multiple times from one scan

**Solution:**
- Increase the delay at the end of `loop()`
- Try: `delay(1000);` instead of `delay(500);`

## Customization Options

### Change Pin Assignments

If your wiring is different, update these lines:
```cpp
#define RST_PIN   22  // Change to your reset pin
#define SS_PIN    5   // Change to your slave select pin
#define SCAN_LED_PIN  2  // Change to your LED pin
```

### Adjust Scan Cooldown

To change how quickly cards can be re-scanned:
```cpp
delay(500);  // Increase for longer delay, decrease for faster rescans
```

### Change LED Flash Duration

To make the LED flash longer or shorter:
```cpp
digitalWrite(SCAN_LED_PIN, LOW);
delay(100);  // Change this value (milliseconds)
digitalWrite(SCAN_LED_PIN, HIGH);
```

### Change Baud Rate

If you need a different serial speed (must match Python script):
```cpp
Serial.begin(115200);  // Change to desired baud rate
```

Also update in `rfid_scanner.py`:
```python
BAUD_RATE = 115200  # Match this value
```

## Advanced Features

### Multiple RFID Readers

To use multiple readers, create separate MFRC522 instances:
```cpp
#define SS_PIN_1  5
#define SS_PIN_2  15
#define RST_PIN   22

MFRC522 reader1(SS_PIN_1, RST_PIN);
MFRC522 reader2(SS_PIN_2, RST_PIN);
```

### Read More Card Data

To read data blocks from the card (not just UID):
```cpp
// Authenticate and read block 4
MFRC522::MIFARE_Key key;
for (byte i = 0; i < 6; i++) key.keyByte[i] = 0xFF;
mfrc522.PCD_Authenticate(MFRC522::PICC_CMD_MF_AUTH_KEY_A, 4, &key, &(mfrc522.uid));
byte buffer[18];
byte size = sizeof(buffer);
mfrc522.MIFARE_Read(4, buffer, &size);
```

### Add Buzzer Feedback

Connect a buzzer to GPIO 4:
```cpp
#define BUZZER_PIN 4

void setup() {
  pinMode(BUZZER_PIN, OUTPUT);
}

void loop() {
  // After successful card read:
  tone(BUZZER_PIN, 2000, 100);  // 2000Hz for 100ms
}
```

## Integration with Python Backend

The Arduino code sends UIDs via serial, which are received by `rfid_scanner.py`:

### Data Flow:
```
[RFID Card] → [MFRC522 Reader] → [ESP32] → [Serial USB] → [Computer]
                                                            ↓
                                                    [rfid_scanner.py]
                                                            ↓
                                                    [PostgreSQL Database]
                                                            ↓
                                                    [Web Application]
```

### Serial Communication Format:
- **From Arduino to Python:** `"4A 2B 81 3D\n"`
- **Format:** Hex bytes separated by spaces, terminated with newline
- **Example UIDs:**
  - `"A1 B2 C3 D4"`
  - `"12 34 56 78"`
  - `"FF EE DD CC BB AA 99"` (7-byte UID)

## Security Considerations

### UID Cloning
- **Risk:** RFID UIDs can be cloned using special devices
- **Mitigation:** Use cards with encrypted sectors for high-security applications
- **Note:** For attendance tracking, UID-only is usually sufficient

### Physical Security
- Keep the RFID reader in a supervised location
- Prevent unauthorized access to the ESP32 USB connection

### Network Security
- Use the serial connection over USB only (not wireless)
- Keep the computer running `rfid_scanner.py` secure

## Maintenance

### Regular Checks
- Clean RFID reader antenna with soft cloth (avoid moisture)
- Check USB cable connection periodically
- Verify LED still functions
- Test with known good cards

### Updating the Code
1. Make changes to `sketch.ino`
2. Re-upload to ESP32
3. Restart Python script if running

### Common Wear Items
- USB cable (may need replacement after heavy use)
- RFID cards (magnetic strips wear over time)
- Jumper wires (connections may loosen)

## References

- **MFRC522 Library Documentation:** [GitHub - miguelbalboa/rfid](https://github.com/miguelbalboa/rfid)
- **ESP32 Pinout:** [ESP32 Pinout Reference](https://randomnerdtutorials.com/esp32-pinout-reference-gpios/)
- **SPI Communication:** [Arduino SPI Library](https://www.arduino.cc/en/reference/SPI)
- **MFRC522 Datasheet:** [NXP MFRC522 Product Page](https://www.nxp.com/products/rfid-nfc/nfc-hf/nfc-readers/standard-3v-mifare-reader-solution:MFRC522)

## Support

For hardware or Arduino-specific issues:
- Check the Arduino Forums: [forum.arduino.cc](https://forum.arduino.cc)
- MFRC522 GitHub Issues: [miguelbalboa/rfid/issues](https://github.com/miguelbalboa/rfid/issues)

For project-specific issues:
- Open an issue on the SmartAttendance GitHub repository
