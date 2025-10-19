# 🖼️ Easy Bitmap Maker 🖼️

Easy Bitmap Maker is a convenient web application for creating, editing, and managing bitmap images. Whether you are making icons, pixel art, or simple graphics, this tool provides all the essential functions you need.

### ✨ Features

- **Custom Dimensions:** Set custom width and height (1-128 pixels each) for flexible bitmap creation.

- **Drawing Tools:**
  - **Fill Mode (🖌️):** Left-click (LMB) to draw pixels, right-click (RMB) to erase.
  - **Erase Mode (🧹):** LMB erases pixels, RMB draws pixels.

- **Precision Editing:**
  - Adjustable pen size (1-10 pixels) using slider or mouse wheel.
  - Undo functionality (Ctrl+Z) to revert changes.

- **Import & Export:**
  - Import bitmaps from C++ code (hex format like 0x00, 0xFF), Arduino binary format (B00000000), or array content.
  - Generate and copy C++ byte arrays in Hex (0x) or Binary (B) format.
  - Size validation ensures imported bitmaps match current grid dimensions.

- **Additional Tools:**
  - Invert all pixels (🔄 Invert Colors).
  - Clear the entire grid with one click (🗑️ Clear Grid).
  - Rotate the bitmap by 90° clockwise (↩️ Rotate 90°).
  - Flip the bitmap horizontally (↔️ Flip Horizontal) or vertically (↕️ Flip Vertical).

- **Interface:**
  - Multi-language support: English, Russian, Spanish, French, German.
  - Responsive design suitable for various devices.
  - Built-in help modal with detailed instructions.

- **Hotkeys:**
  - `D` for Fill mode.
  - `E` for Erase mode.
  - `Ctrl+Z` for undo.
  - `Escape` to close modals.

### 📘 How to Use

1. **Set Dimensions**  
   Use the Width and Height inputs to set custom dimensions (1-128 pixels each).  
   The grid will automatically be created with your specified size.

2. **Drawing and Erasing**  
   Choose Fill mode (🖌️) or Erase mode (🧹).  
   - In Fill mode: LMB draws, RMB erases.  
   - In Erase mode: LMB erases, RMB draws.  
   Adjust the pen size with the slider (1-10 pixels) or use mouse wheel over the slider.

3. **Importing a Bitmap (📥 Import Bitmap)**  
   Click **Import Bitmap**, then paste your C++ code, Arduino binary format (B00000000), or array content.  
   The bitmap size must match the current grid dimensions exactly.

4. **Exporting a Bitmap (💾 Generate C++ Code)**  
   Select output format (Hex or Binary), then click **Generate C++ Code** to view the array.  
   Click **📋 Copy Code** to copy it to your clipboard.

5. **Additional Actions**  
   - **Invert Colors (🔄):** Inverts all pixels.  
   - **Clear Grid (🗑️):** Removes all pixels.  
   - **Rotate 90° (↩️):** Rotates the bitmap 90° clockwise.  
   - **Flip (↔️/↕️):** Flips the bitmap horizontally or vertically.  
   - **Undo (Ctrl+Z):** Reverts the last drawing action.

6. **Language Support**  
   Switch between English, Russian, Spanish, French, and German using the language selector.

### ⚙️ Installation

No installation required. Just open `index.html` in your web browser.

### 🤝 Contributing

Contributions are welcome!  
Feel free to open issues or submit pull requests for improvements and new features.

### 📝 License

This project is licensed under the MIT License.

