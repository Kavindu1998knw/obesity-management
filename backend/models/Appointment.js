import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
  patientId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  doctorId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  date: {
    type: Date,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  reason: {
    type: String,
    trim: true,
    maxlength: 500
  },
  patientNote: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  status: {
    type: String,
    enum: ['pending', 'completed', 'cancelled', 'approved', 'rejected'],
    default: 'pending'
  },
  rejectionReason: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  cancellationReason: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  rescheduleNote: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  adminNote: {
    type: String,
    trim: true,
    maxlength: 1000
  },
  consultationNote: {
    type: String,
    trim: true,
    maxlength: 2000
  },
  followUpRequired: {
    type: Boolean,
    default: false
  },
  suggestedFollowUpDate: {
    type: Date
  }
}, { timestamps: true });

const Appointment = mongoose.model('Appointment', AppointmentSchema);
export default Appointment;
