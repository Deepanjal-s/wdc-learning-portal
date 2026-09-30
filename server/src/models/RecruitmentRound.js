import mongoose from 'mongoose';

const recruitmentRoundSchema = new mongoose.Schema(
  {
    roundNumber: { type: Number, required: true, unique: true, min: 1 },
    title: { type: String, required: true, trim: true },
    description: { type: String, default: '' },
    trackIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
    requirements: { type: [String], default: [] },
    resourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
    taskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    deadline: { type: Date, default: null },
    submissionInstructions: { type: String, default: '' },
    evaluationCriteria: { type: [String], default: [] },
    status: { type: String, enum: ['draft', 'upcoming', 'open', 'closed'], default: 'draft' },
  },
  { timestamps: true },
);

export default mongoose.model('RecruitmentRound', recruitmentRoundSchema);
