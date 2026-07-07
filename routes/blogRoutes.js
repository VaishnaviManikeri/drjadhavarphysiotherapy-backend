import express from 'express';
import { 
  getAllBlogs, 
  getBlogBySlug, 
  createBlog, 
  updateBlog, 
  deleteBlog 
} from '../controllers/blogController.js';
import { authenticate } from '../middleware/auth.js';
import { upload } from '../config/cloudinary.js';

const router = express.Router();

router.get('/', getAllBlogs);
router.get('/:slug', getBlogBySlug);
router.post('/', authenticate, upload.single('featuredImage'), createBlog);
router.put('/:id', authenticate, upload.single('featuredImage'), updateBlog);
router.delete('/:id', authenticate, deleteBlog);

export default router;