const fs = require("fs");
const sharp = require("sharp");

export async function calculateELA(filePath, quality = 90) {
  const tempFile = filePath.replace(/\.\w+$/, "_temp.jpg");

  // Convert the image to a temporary JPEG with specified quality
  await sharp(filePath).jpeg({ quality }).toFile(tempFile);

  // Compute ELA by comparing the original and temporary JPEG images
  const originalBuffer = fs.readFileSync(filePath);
  const tempBuffer = fs.readFileSync(tempFile);
  const originalELA = await sharp(originalBuffer).raw().toBuffer();
  const tempELA = await sharp(tempBuffer).raw().toBuffer();
  const ela = Buffer.from(originalELA).map((value, index) =>
    Math.abs(value - tempELA[index])
  );

  // Clean up temporary file
  fs.unlinkSync(tempFile);

  return ela;
}
