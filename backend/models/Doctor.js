import mongoose from 'mongoose';

const DoctorSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: [true, 'User reference is required'],
  },
  phoneNumber: {
    type: String,
    trim: true,
    default: '',
  },
  specialisation: {
    type: String,
    trim: true,
    default: '',
  },
  qualification: {
    type: String,
    trim: true,
    default: '',
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const Doctor = mongoose.model('Doctor', DoctorSchema);
export default Doctor;
