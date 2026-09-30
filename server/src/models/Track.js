import mongoose from 'mongoose';

const topicSchema = new mongoose.Schema(
  {
    topicKey: { type: String, required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
  },
  { _id: false },
);

const weekSchema = new mongoose.Schema(
  {
    weekKey: { type: String, required: true },
    number: { type: Number, required: true, min: 1 },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    topics: { type: [topicSchema], default: [] },
  },
  { _id: false },
);

const trackSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    isActive: { type: Boolean, default: true },
    weeks: { type: [weekSchema], default: [] },
  },
  { timestamps: true },
);

export default mongoose.model('Track', trackSchema);
