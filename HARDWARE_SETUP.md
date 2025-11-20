# Hardware Setup Guide for SmartAttendance

## Table of Contents
1. [Hardware Requirements](#hardware-requirements)
2. [Shopping List](#shopping-list)
3. [Circuit Diagrams](#circuit-diagrams)
4. [Assembly Instructions](#assembly-instructions)
5. [Testing Hardware](#testing-hardware)
6. [Troubleshooting](#troubleshooting)
7. [Alternative Hardware Options](#alternative-hardware-options)

## Hardware Requirements

### Minimum Requirements (RFID Setup)

| Component | Quantity | Purpose |
|-----------|----------|---------|
| ESP32 Development Board | 1 | Main microcontroller |
| MFRC522 RFID Reader Module | 1 | Read RFID cards |
| RFID Cards/Tags (13.56MHz) | 1+ | Student identification |
| USB Cable (Micro-USB or USB-C) | 1 | Power and programming |
| Jumper Wires (Female-to-Female) | 7 | Connections |
| Computer | 1 | Run Python script |

### Optional Components

| Component | Quantity | Purpose |
|-----------|----------|---------|
| LED (any color) | 1 | Visual scan feedback |
| 220Ω Resistor | 1 | LED current limiting |
| Breadboard | 1 | Prototyping |
| Enclosure/Case | 1 | Protect circuit |
| Buzzer | 1 | Audio feedback |

## Shopping List

### Budget Setup (~$15-20 USD)

**Online Retailers:** Amazon, AliExpress, eBay, Adafruit, SparkFun

| Item | Estimated Cost | Link Example |
|------|---------------|--------------|
| ESP32 DevKit V1 | $5-8 | Search: "ESP32 Development Board" |
| MFRC522 Module | $2-5 | Search: "MFRC522 RFID Reader Module" |
| RFID Cards (10 pack) | $5-8 | Search: "MIFARE RFID Cards 13.56MHz" |
| USB Cable | $2-3 | Search: "Micro USB Cable" or "USB-C Cable" |
| Jumper Wires (40pcs) | $2-3 | Search: "Female to Female Jumper Wires" |

**Total: ~$15-20**

### Premium Setup (~$40-50 USD)

**Additional Items:**
- Better quality ESP32 with metal shield
- Multiple RFID readers for different entrances
- Enclosures for each setup
- Buzzers and LEDs for feedback
- Longer USB cables (5m+)

## Circuit Diagrams

### Basic RFID Setup (No LED)

```
┌─────────────────────────────────────────────────────────────────┐
│                    MINIMAL WIRING DIAGRAM                        │
└─────────────────────────────────────────────────────────────────┘

                    ESP32                         MFRC522
           ┌─────────────────────┐       ┌─────────────────────┐
           │                     │       │                     │
           │              GPIO 5 │───────│ SDA (SS)            │
           │             GPIO 18 │───────│ SCK                 │
           │             GPIO 23 │───────│ MOSI                │
           │             GPIO 19 │───────│ MISO                │
           │             GPIO 22 │───────│ RST                 │
           │                3.3V │───────│ 3.3V                │
           │                 GND │───────│ GND                 │
           │                     │       │                     │
           │         [USB Port]  │       └─────────────────────┘
           └──────────┬──────────┘
                      │
                      │ USB Cable
                      ▼
                ┌──────────┐
                │ Computer │
                └──────────┘
```

### Connection Table (Minimal)

| ESP32 Pin | MFRC522 Pin | Wire Color (Suggested) |
|-----------|-------------|------------------------|
| GPIO 5    | SDA (SS)    | Yellow                 |
| GPIO 18   | SCK         | Orange                 |
| GPIO 23   | MOSI        | Blue                   |
| GPIO 19   | MISO        | Green                  |
| GPIO 22   | RST         | Purple                 |
| 3.3V      | 3.3V        | Red                    |
| GND       | GND         | Black                  |

### Complete Setup (with LED)

```
┌─────────────────────────────────────────────────────────────────┐
│                COMPLETE WIRING DIAGRAM (WITH LED)                │
└─────────────────────────────────────────────────────────────────┘

                    ESP32                         MFRC522
           ┌─────────────────────┐       ┌─────────────────────┐
           │                     │       │                     │
           │              GPIO 5 │───────│ SDA (SS)            │
           │             GPIO 18 │───────│ SCK                 │
           │             GPIO 23 │───────│ MOSI                │
           │             GPIO 19 │───────│ MISO                │
           │             GPIO 22 │───────│ RST                 │
           │                3.3V │───────│ 3.3V                │
           │                 GND │───────│ GND                 │
           │                     │       │                     │
           │              GPIO 2 │       └─────────────────────┘
           │                  │  │
           │                  └──┼──┐
           │                     │  │
           │         [USB Port]  │  │   ┌────────┐
           └──────────┬──────────┘  └───│ 220Ω   │
                      │                 └───┬────┘
                      │                     │
                      │                  ┌──▼──┐
                      │                  │ LED │ ← Anode (Long leg)
                      │                  └──┬──┘
                      │                     │
                      │ USB Cable           │ Cathode (Short leg)
                      ▼                     │
                ┌──────────┐                │
                │ Computer │                │
                │          │────────────────┘
                │   GND    │
                └──────────┘
```

### LED Connection Details

```
                GPIO 2
                   │
                   ├────[ 220Ω Resistor ]────┐
                   │                         │
                   │                    ┌────▼────┐
                   │                    │   LED   │
                   │                    │  Anode  │ ← Longer leg (+)
                   │                    │ (Flat   │
                   │                    │  Side)  │
                   │                    │ Cathode │ ← Shorter leg (-)
                   │                    └────┬────┘
                   │                         │
                   └─────────────────────────┴──── GND

LED Polarity:
  Anode (+)  : Longer leg, connects to resistor → GPIO 2
  Cathode (-): Shorter leg, flat side, connects to GND
```

### Breadboard Layout

```
┌────────────────────────────────────────────────────────────────┐
│                      BREADBOARD VIEW                           │
└────────────────────────────────────────────────────────────────┘

        Power Rails               Main Area
    ┌───────────────┐     ┌──────────────────────┐
    + + + + + + + + +     a b c d e   f g h i j
    - - - - - - - - -     ─────────────────────────
                          1 [ MFRC522 Module    ]
                          2 [                   ]
                          3 [                   ]
                          4 [                   ]
                          5 [                   ]
    + + + + + + + + +     ─────────────────────────
    │ │ │ │ │ │ │ │ │     6 [                   ]
    │ │ │ │ │ │ │ │ │     7 [                   ]
    Red│ │ │ │ │ │ │ │     8 [                   ]
  (3.3V)│ │ │ │ │ │ │     ─────────────────────────
       Black│ │ │ │ │     9  [ ESP32 Module     ]
      (GND) │ │ │ │ │     10 [                  ]
            │ │ │ │ │     11 [                  ]
         Other wires      12 [                  ]
         to GPIO pins     ─────────────────────────

Step-by-step:
1. Insert ESP32 into breadboard (rows 9-20 approximately)
2. Insert MFRC522 module (rows 1-8)
3. Connect 3.3V rail to both modules (red wire)
4. Connect GND rail to both modules (black wire)
5. Connect GPIO pins to MFRC522 pins using jumper wires
6. (Optional) Add LED to GPIO 2 with resistor to GND
```

## Assembly Instructions

### Step 1: Prepare Components

1. **Unpack all components**
   - Lay them out on a clean, static-free surface
   - Check that you have all required items

2. **Identify ESP32 pins**
   - Find GPIO 5, 18, 19, 22, 23 labels on board
   - Locate 3.3V and GND pins
   - Usually labeled on the silkscreen (white text on board)

3. **Identify MFRC522 pins**
   - Should be labeled: SDA, SCK, MOSI, MISO, IRQ, GND, RST, 3.3V
   - IRQ pin is not used (can be left unconnected)

### Step 2: Power Connections First

**Always connect power and ground first for safety**

1. **Connect GND (Ground)**
   ```
   ESP32 GND pin ────[Black Wire]────▶ MFRC522 GND pin
   ```
   - Use a black jumper wire
   - Ensure firm connection on both ends

2. **Connect 3.3V (Power)**
   ```
   ESP32 3.3V pin ────[Red Wire]────▶ MFRC522 3.3V pin
   ```
   - Use a red jumper wire
   - ⚠️ **IMPORTANT:** Use 3.3V, NOT 5V! MFRC522 is 3.3V only

### Step 3: SPI Signal Connections

**Connect the SPI communication pins**

3. **Connect SDA (Slave Select)**
   ```
   ESP32 GPIO 5 ────[Yellow Wire]────▶ MFRC522 SDA
   ```

4. **Connect SCK (Clock)**
   ```
   ESP32 GPIO 18 ────[Orange Wire]────▶ MFRC522 SCK
   ```

5. **Connect MOSI (Master Out Slave In)**
   ```
   ESP32 GPIO 23 ────[Blue Wire]────▶ MFRC522 MOSI
   ```

6. **Connect MISO (Master In Slave Out)**
   ```
   ESP32 GPIO 19 ────[Green Wire]────▶ MFRC522 MISO
   ```

7. **Connect RST (Reset)**
   ```
   ESP32 GPIO 22 ────[Purple Wire]────▶ MFRC522 RST
   ```

### Step 4: Optional LED Connection

**For visual scan feedback**

8. **Prepare LED**
   - Identify anode (longer leg) and cathode (shorter leg)
   - Insert resistor into anode leg (can solder or use breadboard)

9. **Connect LED**
   ```
   ESP32 GPIO 2 ────[Resistor 220Ω]────[LED Anode]
                                           │
                                      [LED Cathode]
                                           │
   ESP32 GND ───────────────────────────────┘
   ```

### Step 5: Physical Mounting (Optional)

**Secure components for permanent installation**

1. **Use breadboard for prototyping**
   - Insert both modules into breadboard
   - Make connections with jumper wires
   - Easy to modify and debug

2. **Use enclosure for permanent setup**
   - Drill holes for USB cable
   - Mount ESP32 with screws or standoffs
   - Position MFRC522 so antenna faces outward
   - Ensure RFID antenna is accessible for card scanning

### Step 6: Cable Management

1. **Organize wires**
   - Group by function (power, signals)
   - Use zip ties or wire channels
   - Label wires for future reference

2. **Secure USB cable**
   - Leave enough slack for movement
   - Strain relief at connection points
   - Route cable away from RFID antenna (reduces interference)

## Testing Hardware

### Pre-Power Checks

**Before connecting USB, verify:**

1. ✅ All connections are secure
2. ✅ No short circuits (wires not touching)
3. ✅ 3.3V used (not 5V)
4. ✅ GND connections present
5. ✅ LED polarity correct (if using)

### Initial Power-On

1. **Connect USB cable**
   ```
   ESP32 ──[USB Cable]──▶ Computer
   ```

2. **Check power indicators**
   - ESP32 should have a power LED (usually blue or red)
   - MFRC522 may have a small LED (if present)
   - If nothing lights up: Check connections

3. **Check Device Manager (Windows)**
   ```
   - Open Device Manager
   - Look under "Ports (COM & LPT)"
   - Should see: "Silicon Labs CP210x USB to UART Bridge (COMx)"
   ```

4. **Check /dev (Linux/Mac)**
   ```bash
   ls /dev/tty* | grep -i usb
   # Should show: /dev/ttyUSB0 or /dev/cu.usbserial-*
   ```

### Software Testing

1. **Upload sketch.ino**
   - Follow instructions in [ARDUINO_SETUP.md](ARDUINO_SETUP.md)
   - Open Arduino IDE
   - Upload code to ESP32

2. **Open Serial Monitor**
   - Tools → Serial Monitor
   - Set baud rate: 115200
   - Should see boot messages from ESP32

3. **Test RFID reading**
   - Hold RFID card near MFRC522 antenna (within 2-3cm)
   - Should see UID printed in Serial Monitor
   - Example: `4A 2B 81 3D`
   - LED should flash (if installed)

### Full System Test

1. **Start Python script**
   ```bash
   python rfid_scanner.py
   ```

2. **Scan RFID card**
   - Hold card near reader
   - Python script should print:
     ```
     ✓ [14:30:15] RFID 4A 2B 81 3D - Student: Alice Johnson
       → LOGIN: Session started
     ```

3. **Scan again (logout)**
   - Remove card, wait 1 second
   - Scan same card again
   - Should print:
     ```
     ✓ [14:32:20] RFID 4A 2B 81 3D - Student: Alice Johnson
       → LOGOUT: Session ended
       → Attendance: Marked present for [classes]
     ```

## Troubleshooting

### Problem: ESP32 not detected by computer

**Possible Causes & Solutions:**

1. **Missing USB drivers**
   - **Solution:** Install CP2102 or CH340 drivers
   - Download from manufacturer website
   - Restart computer after installation

2. **Faulty USB cable**
   - **Solution:** Try different cable
   - Some cables are "charge only" (no data lines)

3. **Wrong USB port**
   - **Solution:** Try different USB port on computer
   - Avoid USB hubs, connect directly to computer

### Problem: MFRC522 not detecting cards

**Possible Causes & Solutions:**

1. **Incorrect wiring**
   - **Check:** All 7 connections (GND, 3.3V, SDA, SCK, MOSI, MISO, RST)
   - **Verify:** Use multimeter to check continuity

2. **Wrong voltage**
   - **Check:** Using 3.3V, not 5V
   - **Fix:** If using 5V, disconnect immediately and use 3.3V

3. **MFRC522 damaged**
   - **Test:** Try different MFRC522 module
   - **Note:** These modules are cheap, may arrive damaged

4. **Card not compatible**
   - **Check:** Card must be 13.56 MHz (not 125 kHz)
   - **Test:** Look for "MIFARE" or "ISO 14443" marking on card

5. **Card too far from reader**
   - **Solution:** Hold card within 2-3 cm of antenna
   - **Antenna location:** Usually a rectangular copper coil on MFRC522

### Problem: Intermittent reads (works sometimes)

**Possible Causes & Solutions:**

1. **Loose connections**
   - **Solution:** Press jumper wires firmly into pins
   - **Better:** Solder connections for permanent setup

2. **Interference**
   - **Solution:** Move away from other electronics
   - **Avoid:** Wi-Fi routers, motors, power supplies

3. **Power issues**
   - **Solution:** Use powered USB hub
   - **Alternative:** External 3.3V power supply

### Problem: LED doesn't flash

**Possible Causes & Solutions:**

1. **LED backwards**
   - **Fix:** Reverse LED (anode to resistor, cathode to GND)

2. **Wrong GPIO pin**
   - **Check:** Using GPIO 2 (defined in code)
   - **Fix:** Update code if using different pin

3. **No resistor**
   - **Problem:** LED may burn out without resistor
   - **Fix:** Always use 220Ω resistor

### Problem: Serial Monitor shows garbage

**Possible Causes & Solutions:**

1. **Wrong baud rate**
   - **Fix:** Set Serial Monitor to 115200 baud
   - **Match:** Must match `Serial.begin(115200)` in code

2. **Code not uploaded**
   - **Fix:** Re-upload sketch.ino to ESP32

## Alternative Hardware Options

### Instead of ESP32

1. **Arduino Uno R3**
   - ✅ Cheaper (~$3-5)
   - ❌ Requires USB-to-Serial adapter
   - ❌ Less processing power

2. **Raspberry Pi Pico**
   - ✅ Very cheap (~$4)
   - ✅ More powerful
   - ❌ Different programming (MicroPython)

3. **Arduino Nano**
   - ✅ Compact size
   - ✅ Built-in USB
   - ❌ Limited GPIO pins

### Instead of MFRC522

1. **PN532 NFC Module**
   - ✅ Longer range (up to 10cm)
   - ✅ More features (NFC read/write)
   - ❌ More expensive (~$10-15)

2. **RC522 (13.56 MHz)**
   - ✅ Similar to MFRC522
   - ✅ Same pinout
   - ✅ Interchangeable

3. **125 kHz RFID Readers**
   - ❌ Different frequency
   - ❌ Different cards needed
   - ❌ Not recommended (older technology)

### Budget Alternatives

**If cost is a concern:**

1. **Skip hardware entirely**
   - Use web interface only
   - Students login via browser
   - Works, but less convenient

2. **Use smartphone as reader**
   - Many phones have NFC
   - Develop mobile app
   - More complex programming

3. **Buy complete kit**
   - Search: "ESP32 RFID Starter Kit"
   - Includes all components
   - Usually $20-30
   - Good for beginners

## Enclosure Ideas

### 3D Printed Enclosure

**If you have access to a 3D printer:**

```
┌─────────────────────────────────┐
│        3D Printed Case          │
│  ┌───────────────────────────┐  │
│  │                           │  │
│  │     [ESP32 Inside]        │  │
│  │                           │  │
│  │  ┌─────────────────────┐  │  │
│  │  │  MFRC522 Window     │◀─┼──┼─ Cutout for antenna
│  │  │  (Antenna exposed)  │  │  │
│  │  └─────────────────────┘  │  │
│  └───────────────────────────┘  │
│                                 │
│  [USB Cable Port]◀──────────────┼─ Hole for USB cable
└─────────────────────────────────┘
```

**STL Files:** Search online for "ESP32 MFRC522 enclosure"

### DIY Enclosure

**Materials:**
- Plastic project box (~$3-5)
- Drill
- Hot glue or double-sided tape

**Steps:**
1. Drill hole for USB cable
2. Mark position for MFRC522
3. Cut rectangular hole for antenna (or leave module outside)
4. Mount ESP32 inside with tape/glue
5. Position MFRC522 so antenna faces hole
6. Route wires neatly inside
7. Close enclosure

### Weatherproof Outdoor Setup

**For outdoor installation:**

1. **IP65-rated enclosure**
   - Waterproof/dustproof
   - Available at electronics stores
   - ~$10-20

2. **Seal USB cable entry**
   - Use cable gland
   - Silicone sealant

3. **Protect MFRC522**
   - Position inside enclosure
   - Use clear plastic window over antenna
   - Test range with window in place

## Safety Notes

⚠️ **Important Safety Information:**

1. **Voltage**
   - Always use 3.3V for MFRC522, never 5V
   - Double-check before powering on

2. **Static Electricity**
   - Touch grounded metal before handling components
   - ESP32 and MFRC522 are static-sensitive

3. **Short Circuits**
   - Check all connections before powering
   - Ensure no wires touch incorrectly

4. **USB Port**
   - Don't exceed USB port current limit (~500mA)
   - Use powered hub for multiple devices

5. **Heat**
   - ESP32 may get warm during operation (normal)
   - If too hot to touch, disconnect and check for shorts

## Maintenance

### Regular Checks

**Weekly:**
- Inspect wire connections (tighten if loose)
- Clean RFID antenna with soft cloth
- Test with known-good card

**Monthly:**
- Check for corrosion (especially in humid environments)
- Verify USB cable integrity
- Update firmware if needed

### Long-Term Storage

**If not using for extended period:**
1. Disconnect USB cable
2. Store in anti-static bag
3. Keep in dry, cool location
4. Re-test before use

## Resources

### Datasheets

- **ESP32:** [Espressif ESP32 Datasheet](https://www.espressif.com/sites/default/files/documentation/esp32_datasheet_en.pdf)
- **MFRC522:** [NXP MFRC522 Datasheet](https://www.nxp.com/docs/en/data-sheet/MFRC522.pdf)

### Tutorials

- **ESP32 Getting Started:** [Random Nerd Tutorials](https://randomnerdtutorials.com/getting-started-with-esp32/)
- **MFRC522 Library:** [GitHub - miguelbalboa/rfid](https://github.com/miguelbalboa/rfid)

### Community Support

- **Arduino Forum:** [forum.arduino.cc](https://forum.arduino.cc)
- **ESP32 Forum:** [esp32.com](https://esp32.com)
- **Reddit:** r/arduino, r/esp32

---

## Next Steps

After hardware setup is complete:

1. ✅ Hardware assembled and tested
2. → **[Arduino Setup Guide](ARDUINO_SETUP.md)** - Upload code and configure
3. → **[RFID Integration](RFID_INTEGRATION.md)** - Connect to database
4. → **[Workflow Guide](WORKFLOW.md)** - Understand the complete process

---

**Need help?** Open an issue on the GitHub repository with photos of your setup!
