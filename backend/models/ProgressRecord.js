import mongoose from 'mongoose';

const ProgressRecordSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  bmi: {
    type: Number,
    required: true
  },
  weight: {
    type: Number,
    required: true
  },
  mealAdherence: {
    type: String,
    enum: ['Not Followed', 'Partially Followed', 'Mostly Followed', 'Fully Followed', 'Not Applicable'],
    default: 'Not Applicable'
  },
  physicalActivity: {
    type: String,
    enum: ['None', 'Light', 'Moderate', 'High'],
    default: 'None'
  },
  note: {
    type: String,
    trim: true,
    default: ''
  },
  date: {
    type: Date,
    default: Date.now
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

const ProgressRecord = mongoose.model('ProgressRecord', ProgressRecordSchema);
export default ProgressRecord;
