const express = require("express");
const router = express.Router();
const tf = require("@tensorflow/tfjs-node");
const upload = require("../utils/multerUtils");
const sharp = require("sharp");

// Function to calculate ELA
async function convertToELAImage(path, quality) {
  const tempFilename = "temp_file_name.jpg";
  const elaFilename = "temp_ela.png";

  try {
    // Read the image
    const imageBuffer = fs.readFileSync(path);
    console.log("ImageBuffer", imageBuffer);

    // Save the image with specified quality
    await sharp(imageBuffer).jpeg({ quality }).toFile(tempFilename);

    // Read the temporary image
    const tempImageBuffer = fs.readFileSync(tempFilename);

    // Calculate ELA
    const originalImage = await sharp(imageBuffer).toBuffer();
    const tempImage = await sharp(tempImageBuffer).toBuffer();
    const elaBuffer = Buffer.from(
      originalImage.map((value, index) => Math.abs(value - tempImage[index]))
    );

    // Enhance brightness
    const extrema = await sharp(elaBuffer)
      .stats()
      .then((stats) => stats.channels.map((channel) => channel.max));
    const maxDiff = Math.max(...extrema);
    const scale = 255.0 / maxDiff;
    const enhancedELA = await sharp(elaBuffer)
      .modulate({ brightness: scale })
      .toFile(elaFilename);

    return elaFilename; // Return the filename of the generated ELA image
  } catch (error) {
    console.error("Error converting to ELA image:", error);
    throw error;
  } finally {
    // Clean up: remove temporary files
    fs.unlinkSync(tempFilename);
  }
}

async function prepareImage(imagePath) {
  try {
    // Convert to ELA image
    const elaBuffer = await convertToELAImage(imagePath, 90);

    // Read ELA image buffer
    const elaImage = await sharp(elaBuffer).toBuffer();

    // Resize and normalize image
    const resizedImage = await tf.node.decodeImage(elaImage, 3);
    const resizedImageNormalized = resizedImage
      .resizeBilinear([128, 128])
      .toFloat()
      .div(tf.scalar(255.0))
      .arraySync();

    // Flatten the image array
    const flattenedImage = resizedImageNormalized.flat();

    return flattenedImage;
  } catch (error) {
    console.error("Error preparing image:", error);
    throw error;
  }
}

app.post("/predict", upload.single("file"), async (req, res) => {
  try {
    console.log(req.file);
    // Check if an image was uploaded
    if (!req.file) {
      return res.status(400).send("No image uploaded.");
    }

    // Apply ELA
    const ela = await calculateELA(req.file.path);

    // Load the models
    const modelPath_V1 = "/public/models_js/model.json";
    const modelPath_V2 = "/public/models_js_v2/model.json";
    const model_v1 = await tf.loadLayersModel("file:/" + modelPath_V1);
    const model_v2 = await tf.loadLayersModel("file:/" + modelPath_V2);

    // Normalize and preprocess the image
    const preparedImage = await prepareImage(req.file.path);

    // Make predictions
    const prediction_v1 = model_v1.predict(tf.tensor([preparedImage]));
    const prediction_v2 = model_v2.predict(tf.tensor([preparedImage]));

    // Convert predictions to JSON
    const predictionArray_v1 = Array.from(prediction_v1.dataSync());
    const predictionArray_v2 = Array.from(prediction_v2.dataSync());

    console.log(predictionArray_v1, predictionArray_v2);

    // const jsonResponse = {
    //   prediction_v1: predictionArray_v1,
    //   prediction_v2: predictionArray_v2,
    // };

    // // Send the predictions and ELA as JSON response
    // res.json({ ...jsonResponse, ela: Array.from(ela) });

    // Clean up: remove the uploaded image file
    tf.dispose([model_v1, model_v2, prediction_v1, prediction_v2]);
    fs.unlinkSync(req.file.path);
  } catch (error) {
    console.error("Error:", error);
    res.status(500).send("Error making prediction.");
  }
});
