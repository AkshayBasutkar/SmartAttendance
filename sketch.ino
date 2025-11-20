#include <SPI.h>
#include <MFRC522.h>

// Define the RC522 pins
#define RST_PIN   22
#define SS_PIN    5

// --- NEW ---
// Define the pin for the "Scan" indicator LED
#define SCAN_LED_PIN  2

// Create an MFRC522 instance
MFRC522 mfrc522(SS_PIN, RST_PIN);

void setup() {
  Serial.begin(115200);
  SPI.begin();
  mfrc522.PCD_Init();
  
  // --- NEW ---
  // Set up the LED pin as an output and turn it off
  pinMode(SCAN_LED_PIN, OUTPUT);
  digitalWrite(SCAN_LED_PIN, HIGH);
  
  // A small delay on setup can sometimes help
  // the serial port connect before data starts
  delay(500); 
}

void loop() {
  if (!mfrc522.PICC_IsNewCardPresent() || !mfrc522.PICC_ReadCardSerial()) {
    return;
  }

  // A card is found
  String uidString = "";
  for (byte i = 0; i < mfrc522.uid.size; i++) {
    uidString.concat(String(mfrc522.uid.uidByte[i] < 0x10 ? " 0" : " "));
    uidString.concat(String(mfrc522.uid.uidByte[i], HEX));
  }
  uidString.trim();

  // 1. Send the UID over serial
  Serial.println(uidString);

  // --- NEW ---
  // 2. Flash the scan LED to show it was sent
  digitalWrite(SCAN_LED_PIN, LOW);
  delay(100); // Flash for 0.1 seconds
  digitalWrite(SCAN_LED_PIN, HIGH);

  // Halt the tag
  mfrc522.PICC_HaltA();
  mfrc522.PCD_StopCrypto1();

  delay(500); // Prevent spamming
}
