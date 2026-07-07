import express from 'express';
import { 
  getAllGallery, 
  createGalleryItem, 
  updateGalleryItem, 
  deleteGalleryItem 
} from '../controllers/galleryController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.get('/', getAllGallery);
router.post('/', authenticate, upload.single('file'), createGalleryItem);
router.put('/:id', authenticate, upload.single('file'), updateGalleryItem);
router.delete('/:id', authenticate, deleteGalleryItem);

export default router;