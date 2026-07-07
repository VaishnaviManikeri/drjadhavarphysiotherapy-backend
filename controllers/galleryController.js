import Gallery from '../models/Gallery.js';
import { cloudinary } from '../config/cloudinary.js';

const getVideoThumbnail = (publicId) => cloudinary.url(publicId, {
  resource_type: 'video',
  format: 'jpg',
  transformation: [
    { start_offset: '0', width: 800, height: 450, crop: 'fill', quality: 'auto' }
  ]
});

const getYouTubeId = (url = '') => {
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([\w-]{11})/i);
  return match?.[1];
};

const getYouTubeThumbnail = (url) => {
  const videoId = getYouTubeId(url);
  return videoId ? `https://img.youtube.com/vi/${videoId}/hqdefault.jpg` : undefined;
};

export const getAllGallery = async (req, res) => {
  try {
    const items = await Gallery.find().sort({ order: 1, createdAt: -1 });
    res.json(items.map((item) => {
      const data = item.toObject();
      if (data.type === 'video' && data.publicId && !data.thumbnailUrl) {
        data.thumbnailUrl = getVideoThumbnail(data.publicId);
      } else if (data.type === 'video' && !data.thumbnailUrl) {
        data.thumbnailUrl = getYouTubeThumbnail(data.url);
      }
      return data;
    }));
  } catch (error) {
    res.status(500).json({ message: 'Error fetching gallery', error: error.message });
  }
};

export const createGalleryItem = async (req, res) => {
  try {
    const { title, type, description, url, order } = req.body;
    
    let finalUrl = url;
    let publicId = null;
    
    if (req.file) {
      finalUrl = req.file.path;
      publicId = req.file.filename;
    }

    if (!finalUrl) {
      return res.status(400).json({ message: 'An uploaded file or media URL is required' });
    }

    const galleryItem = new Gallery({
      title,
      type,
      url: finalUrl,
      publicId,
      thumbnailUrl: type === 'video'
        ? publicId ? getVideoThumbnail(publicId) : getYouTubeThumbnail(finalUrl)
        : undefined,
      description,
      order: order || 0
    });

    await galleryItem.save();
    res.status(201).json(galleryItem);
  } catch (error) {
    res.status(500).json({ message: 'Error creating gallery item', error: error.message });
  }
};

export const updateGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, type, description, url, order, isActive } = req.body;

    const galleryItem = await Gallery.findById(id);
    if (!galleryItem) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    // If new file uploaded, delete old from cloudinary
    if (req.file && galleryItem.publicId) {
      await cloudinary.uploader.destroy(galleryItem.publicId, {
        resource_type: galleryItem.type === 'video' ? 'video' : 'image'
      });
      galleryItem.url = req.file.path;
      galleryItem.publicId = req.file.filename;
    } else if (req.file) {
      galleryItem.url = req.file.path;
      galleryItem.publicId = req.file.filename;
    } else if (url && url !== galleryItem.url) {
      if (galleryItem.publicId) {
        await cloudinary.uploader.destroy(galleryItem.publicId, {
          resource_type: galleryItem.type === 'video' ? 'video' : 'image'
        });
      }
      galleryItem.url = url;
      galleryItem.publicId = undefined;
      galleryItem.thumbnailUrl = undefined;
    }

    galleryItem.title = title ?? galleryItem.title;
    galleryItem.type = type ?? galleryItem.type;
    galleryItem.description = description ?? galleryItem.description;
    galleryItem.order = order !== undefined ? order : galleryItem.order;
    galleryItem.isActive = isActive !== undefined ? isActive : galleryItem.isActive;

    if (galleryItem.type === 'video' && galleryItem.publicId) {
      galleryItem.thumbnailUrl = getVideoThumbnail(galleryItem.publicId);
    } else if (galleryItem.type === 'video') {
      galleryItem.thumbnailUrl = getYouTubeThumbnail(galleryItem.url);
    } else if (galleryItem.type !== 'video') {
      galleryItem.thumbnailUrl = undefined;
    }

    await galleryItem.save();
    res.json(galleryItem);
  } catch (error) {
    res.status(500).json({ message: 'Error updating gallery item', error: error.message });
  }
};

export const deleteGalleryItem = async (req, res) => {
  try {
    const { id } = req.params;
    const galleryItem = await Gallery.findById(id);
    
    if (!galleryItem) {
      return res.status(404).json({ message: 'Gallery item not found' });
    }

    // Delete from cloudinary if exists
    if (galleryItem.publicId) {
      await cloudinary.uploader.destroy(galleryItem.publicId, {
        resource_type: galleryItem.type === 'video' ? 'video' : 'image'
      });
    }

    await galleryItem.deleteOne();
    res.json({ message: 'Gallery item deleted successfully' });
  } catch (error) {
    res.status(500).json({ message: 'Error deleting gallery item', error: error.message });
  }
};
