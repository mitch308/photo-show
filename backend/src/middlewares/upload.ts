import multer from 'multer';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import { Request } from 'express';
import { getUploadPath, ALLOWED_IMAGE_TYPES, ALLOWED_VIDEO_TYPES, MAX_FILE_SIZE } from '../config/storage.js';

// Storage configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const { dir } = getUploadPath();
    cb(null, dir);
  },
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname);
    // Use fileHash from body or query if provided, otherwise fallback to UUID
    const hash = req.body.fileHash || req.query.fileHash;
    if (hash) {
      cb(null, `${hash}${ext}`);
    } else {
      const uuid = uuidv4();
      cb(null, `${uuid}${ext}`);
    }
  },
});

// File filter for images only
const imageFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid image type. Allowed: ${ALLOWED_IMAGE_TYPES.join(', ')}`));
  }
};

// File filter for videos only
const videoFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid video type. Allowed: ${ALLOWED_VIDEO_TYPES.join(', ')}`));
  }
};

// File filter for both images and videos
const anyMediaFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
  if (ALLOWED_IMAGE_TYPES.includes(file.mimetype) || ALLOWED_VIDEO_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed: ${[...ALLOWED_IMAGE_TYPES, ...ALLOWED_VIDEO_TYPES].join(', ')}`));
  }
};

// Multer instances for different upload scenarios
export const uploadImage = multer({
  storage,
  fileFilter: imageFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const uploadVideo = multer({
  storage,
  fileFilter: videoFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});

export const uploadAny = multer({
  storage,
  fileFilter: anyMediaFilter,
  limits: { fileSize: MAX_FILE_SIZE },
});