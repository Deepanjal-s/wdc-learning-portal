import mongoose from 'mongoose';

const progressSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    trackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', required: true },
    completedTopicKeys: { type: [String], default: [] },
    completedResourceIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Resource' }],
    completedTaskIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Task' }],
    taskSubmissions: [{
      taskId: { type: mongoose.Schema.Types.ObjectId, ref: 'Task', required: true },
      figmaUrl: { type: String, required: true, trim: true, maxlength: 2048 },
    }],
  },
  { timestamps: true },
);

progressSchema.index({ userId: 1, trackId: 1 }, { unique: true });

export default mongoose.model('Progress', progressSchema);
