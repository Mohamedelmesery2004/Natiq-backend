import mongoose from 'mongoose';

const taskSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: [true, 'User ID is required'],
      index: true,
    },
    companyId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Company',
      required: [true, 'Company ID is required'],
      index: true,
    },
    title: {
      type: String,
      required: [true, 'Title is required'],
      trim: true,
      maxlength: 500,
    },
    date: {
      type: String, // YYYY-MM-DD
      required: [true, 'Date is required'],
      index: true,
    },
    time: {
      type: String, // HH:mm
      default: null,
    },
    done: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for efficient querying by user and date
taskSchema.index({ userId: 1, date: 1 });

export default mongoose.model('Task', taskSchema);
