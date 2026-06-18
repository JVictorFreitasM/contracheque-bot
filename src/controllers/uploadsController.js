// src/controllers/uploadsController.js
module.exports = (req, res) => {
  // Multer middleware already saved files to uploads directory
  const fileNames = Array.isArray(req.files) ? req.files.map((file) => file.originalname) : [];
  res.status(201).json({
    message: 'Upload concluído',
    files: fileNames
  });
};
