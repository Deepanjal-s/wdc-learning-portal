import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, lowercase: true, trim: true },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    instructions: { type: String, required: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true, index: true },
    weekKey: { type: String, default: null },
    roundId: { type: mongoose.Schema.Types.ObjectId, ref: 'RecruitmentRound', default: null },
    difficulty: { type: String, enum: ['beginner', 'intermediate', 'advanced'], default: 'beginner' },
    estimatedMinutes: { type: Number, min: 1 },
    deadline: { type: Date, default: null },
    referenceImageUrl: { type: String, trim: true, maxlength: 1000 },
    submissionType: { type: String, enum: ['mark-complete', 'design-link', 'code-link', 'file'], default: 'mark-complete' },
    evaluationCriteria: { type: [String], default: [] },
    isPublished: { type: Boolean, default: false },
  },
  { timestamps: true },
);

taskSchema.index({ trackId: 1, weekKey: 1, isPublished: 1 });

export default mongoose.model('Task', taskSchema);
