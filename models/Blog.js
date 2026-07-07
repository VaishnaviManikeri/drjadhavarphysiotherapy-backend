import mongoose from 'mongoose';

const blogSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true
  },
  slug: {
    type: String,
    required: true,
    unique: true
  },
  content: {
    type: String,
    required: true
  },
  excerpt: String,
  featuredImage: String,
  featuredImagePublicId: String,
  author: {
    type: String,
    default: 'Admin'
  },
  readTime: Number,
  metaTitle: String,
  metaDescription: String,
  tags: [String],
  status: {
    type: String,
    enum: ['draft', 'published'],
    default: 'draft'
  },
  views: {
    type: Number,
    default: 0
  },
  isPublished: {
    type: Boolean,
    default: false
  },
  publishedAt: Date
}, { timestamps: true });

blogSchema.pre('save', function(next) {
  if (this.isModified('content')) {
    // Calculate read time (approximately 200 words per minute)
    const words = this.content.replace(/<[^>]*>/g, '').split(/\s+/).length;
    this.readTime = Math.ceil(words / 200);
  }
  next();
});

export default mongoose.model('Blog', blogSchema);