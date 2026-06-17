// src/controllers/uploadsController.js
module.exports = (req, res) => {
  // Multer middleware already saved file to uploads directory
  // Respond with a message and the uploaded filename
  const fileNames = req.file ? [req.file.originalname] : [];
  res.status(201).json({
    message: 'Upload concluído',
    files: fileNames
  });
};
