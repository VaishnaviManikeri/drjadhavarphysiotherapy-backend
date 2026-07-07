import Blog from '../models/Blog.js';
import { cloudinary } from '../config/cloudinary.js';

const generateSlug = (title) => {
  return title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
};

export const getAllBlogs = async (req, res) => {
  try {
    const blogs = await Blog.find()
      .sort({ createdAt: -1 })
      .select('-content');
    res.json(blogs);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blogs', error: error.message });
  }
};

export const getBlogBySlug = async (req, res) => {
  try {
    const { slug } = req.params;
    const blog = await Blog.findOne({ slug, isPublished: true });
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    blog.views += 1;
    await blog.save();

    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error fetching blog', error: error.message });
  }
};

export const createBlog = async (req, res) => {
  try {
    const { title, content, excerpt, author, metaTitle, metaDescription, tags, status } = req.body;
    
    const slug = generateSlug(title);
    
    // Check if slug already exists
    const existingBlog = await Blog.findOne({ slug });
    if (existingBlog) {
      return res.status(400).json({ message: 'A blog with this title already exists' });
    }

    let featuredImage = null;
    let featuredImagePublicId = null;

    if (req.file) {
      featuredImage = req.file.path;
      featuredImagePublicId = req.file.filename;
    }

    const blog = new Blog({
      title,
      slug,
      content,
      excerpt,
      featuredImage,
      featuredImagePublicId,
      author: author || 'Admin',
      metaTitle: metaTitle || title,
      metaDescription: metaDescription || excerpt || '',
      tags: tags ? tags.split(',').map(t => t.trim()) : [],
      status: status || 'draft',
      isPublished: status === 'published',
      publishedAt: status === 'published' ? new Date() : null
    });

    await blog.save();
    res.status(201).json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error creating blog', error: error.message });
  }
};

export const updateBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, content, excerpt, author, metaTitle, metaDescription, tags, status } = req.body;

    const blog = await Blog.findById(id);
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    // Update slug if title changed
    if (title && title !== blog.title) {
      const newSlug = generateSlug(title);
      const existingBlog = await Blog.findOne({ slug: newSlug, _id: { $ne: id } });
      if (existingBlog) {
        return res.status(400).json({ message: 'A blog with this title already exists' });
      }
      blog.slug = newSlug;
      blog.title = title;
    }

    // Update featured image if new file uploaded
    if (req.file) {
      if (blog.featuredImagePublicId) {
        await cloudinary.uploader.destroy(blog.featuredImagePublicId);
      }
      blog.featuredImage = req.file.path;
      blog.featuredImagePublicId = req.file.filename;
    }

    blog.content = content || blog.content;
    blog.excerpt = excerpt || blog.excerpt;
    blog.author = author || blog.author;
    blog.metaTitle = metaTitle || blog.metaTitle;
    blog.metaDescription = metaDescription || blog.metaDescription;
    blog.tags = tags ? tags.split(',').map(t => t.trim()) : blog.tags;
    blog.status = status || blog.status;
    blog.isPublished = status === 'published';
    blog.publishedAt = status === 'published' && !blog.publishedAt ? new Date() : blog.publishedAt;

    await blog.save();
    res.json(blog);
  } catch (error) {
    res.status(500).json({ message: 'Error updating blog', error: error.message });
  }
};

export const deleteBlog = async (req, res) => {
  try {
    const { id } = req.params;
    const blog = await Blog.findById(id);
    
    if (!blog) {
      return res.status(404).json({ message: 'Blog not found' });
    }

    if (blog.featuredImagePublicId) {
      await cloudinary.uploader.destroy(blog.featuredImagePublicId);
    }

    await blog.deleteOne();
    res.json({ message: 'Blog deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting blog', error: error.message });
  }
};