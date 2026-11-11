
import multer from "multer";

const allowedTypes = ["image/jpeg", "image/png", "image/webp", "image/gif"];

const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    fileSize: 5 * 1024 * 1024,
  },
  fileFilter: (req, file, callback) => {
    if (!allowedTypes.includes(file.mimetype)) {
      return callback(new Error("Only JPEG, PNG, WEBP, and GIF images are allowed"));
    }

    callback(null, true);
  },
});

export const imageUpload = upload.single("image");

export const uploadStudioImage = async (req, res, next) => {
  try {
    if (!process.env.IMGBB_API_KEY) {
      return res.status(500).json({
        success: false,
        message: "Image upload service is not configured",
      });
    }

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please select an image",
      });
    }

    const formData = new FormData();

    const imageBlob = new Blob([req.file.buffer], {
      type: req.file.mimetype,
    });

    formData.append("image", imageBlob, req.file.originalname);

    const response = await fetch(
      `https://api.imgbb.com/1/upload?key=${process.env.IMGBB_API_KEY}`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await response.json();

    if (!response.ok || !result.success) {
      return res.status(502).json({
        success: false,
        message: "Image hosting service failed to upload the image",
      });
    }

    res.status(200).json({
      success: true,
      message: "Image uploaded successfully",
      data: {
        url: result.data.url,
        displayUrl: result.data.display_url,
        deleteUrl: result.data.delete_url,
      },
    });
  } catch (error) {
    next(error);
  }
};
