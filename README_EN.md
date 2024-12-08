# 🖼️ Easy Bitmap Maker 🖼️

Easy Bitmap Maker is a convenient web application for creating, editing, and managing bitmap images. Whether you are making icons, pixel art, or simple graphics, this tool provides all the essential functions you need.

### ✨ Features

- **Bitmap Type Selection:** Choose one of the supported types (`uint8_t`, `uint16_t`, `uint32_t`, `uint64_t`) to automatically create a square grid of 8x8, 16x16, 32x32, or 64x64 pixels.

- **Drawing Tools:**
  - **Fill Mode (🖌️):** Left-click (LMB) to draw pixels, right-click (RMB) to erase.
  - **Erase Mode (🧹):** LMB erases pixels, RMB draws pixels.

- **Precision Editing:**
  - Adjustable pen size for detailed editing.
  - The grid is automatically generated when you change the bitmap type.

- **Import & Export:**
  - Import a bitmap from C++ code (📥 Import Bitmap). If the size differs, the tool tries to adjust automatically.
  - Generate and copy a C++ byte array (💾 Generate C++ Code) representing your bitmap.

- **Additional Tools:**
  - Invert all pixels (🔄 Invert).
  - Clear the entire grid with one click (🗑️ Clear Grid).
  - Rotate the bitmap by 90° clockwise (↩️ Rotate).
  - Flip the bitmap horizontally (↔️) or vertically (↕️).

- **Interface:**
  - Switch between English and Russian.
  - Responsive design suitable for various devices.

- **Hotkeys:**
  - `D` for Fill mode.
  - `E` for Erase mode.

### 📘 How to Use

1. **Select Bitmap Type**  
   Use the dropdown to choose `uint8_t`, `uint16_t`, `uint32_t`, or `uint64_t`.  
   The grid will automatically be created with the corresponding size: 8x8, 16x16, 32x32, or 64x64.

2. **Drawing and Erasing**  
   Choose Fill mode (🖌️) or Erase mode (🧹).  
   - In Fill mode: LMB draws, RMB erases.  
   - In Erase mode: LMB erases, RMB draws.  
   Adjust the pen size with the slider.

3. **Importing a Bitmap (📥 Import Bitmap)**  
   Click **Import Bitmap**, then paste your C++ code array.  
   If the size does not match, the tool will attempt to select the closest available dimension.  
   Confirm the import to see the bitmap in the grid.

4. **Exporting a Bitmap (💾 Generate C++ Code)**  
   Click **Generate C++ Code** to get the array.  
   Click **📋 Copy Code** to copy it to your clipboard.

5. **Additional Actions**  
   - **Invert Colors (🔄):** Inverts all pixels.  
   - **Clear Grid (🗑️):** Removes all pixels.  
   - **Rotate 90° (↩️):** Rotates the bitmap 90° clockwise.  
   - **Flip (↔️/↕️):** Flips the bitmap horizontally or vertically.

### ⚙️ Installation

No installation required. Just open `index.html` in your web browser.

### 🤝 Contributing

Contributions are welcome!  
Feel free to open issues or submit pull requests for improvements and new features.

### 📝 License

This project is licensed under the MIT License.

