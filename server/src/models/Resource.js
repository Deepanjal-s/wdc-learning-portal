import mongoose from 'mongoose';

const resourceSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    url: { type: String, required: true, trim: true },
    type: { type: String, enum: ['youtube', 'course', 'documentation', 'figma-community', 'article', 'practice'], required: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true, index: true },
    weekKey: { type: String, required: true },
    topicKey: { type: String, default: null },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    estimatedMinutes: { type: Number, min: 1 },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

resourceSchema.index({ trackId: 1, weekKey: 1, isPublished: 1 });

export default mongoose.model('Resource', resourceSchema);
