import mongoose from 'mongoose';

const userSchema = new mongoose.Schema(
  {
    name: { type: String, required: true, trim: true, maxlength: 80 },
    email: { type: String, required: true, unique: true, lowercase: true, trim: true, maxlength: 254 },
    passwordHash: { type: String, required: true, select: false },
    branch: { type: String, trim: true, maxlength: 80 },
    year: { type: Number, min: 2, max: 2 },
    // Tracks the student is enrolled in. selectedTrackId is the currently
    // active track; it must always be one of selectedTrackIds. Existing users
    // created before this field existed are treated as enrolled in their
    // selectedTrackId (see scripts/migrateTrackAssignments.js).
    selectedTrackIds: [{ type: mongoose.Schema.Types.ObjectId, ref: 'Track' }],
    selectedTrackId: { type: mongoose.Schema.Types.ObjectId, ref: 'Track', default: null },
    githubUrl: { type: String, trim: true, maxlength: 500 },
    portfolioUrl: { type: String, trim: true, maxlength: 500 },
    role: { type: String, enum: ['student', 'admin'], default: 'student' },
  },
  { timestamps: true },
);

export default mongoose.model('User', userSchema);
