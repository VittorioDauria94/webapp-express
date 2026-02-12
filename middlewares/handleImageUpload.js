import multer from "multer";

const storage = multer.diskStorage({
  destination: "public/img",
  filename: (req, file, callbackFn) => {
    const name = `${Date.now()}-${file.originalname}`;
    callbackFn(null, name);
  },
});

const upload = multer({ storage });

export default upload;
