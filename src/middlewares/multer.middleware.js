import multer from "multer";
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
      cb(null, 'C:/Users/chand/OneDrive/Documents/Backend/Project/public/temp')
    },
    filename: function (req, file, cb) {
      cb(null, file.originalname)
    }
  })
  
//   export const upload = multer({ storage: storage })
export const upload = multer({ storage,})