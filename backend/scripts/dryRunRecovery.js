import mongoose from 'mongoose';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(process.cwd(), '.env') });

async function run() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    const db = mongoose.connection.db;

    const report = { counts: {}, doctors: [], relatedData: [] };

    // C. Counts
    report.counts.usersDoctorRole = await db.collection('users').countDocuments({ role: 'doctor' });
    report.counts.doctorProfiles = await db.collection('doctors').countDocuments();
    report.counts.patientsAssigned = await db.collection('patients').countDocuments({ assignedDoctor: { $ne: null } });
    report.counts.assessments = await db.collection('assessments').countDocuments();
    report.counts.appointments = await db.collection('appointments').countDocuments();
    report.counts.mealPlans = await db.collection('mealplans').countDocuments();
    report.counts.doctorNotes = await db.collection('doctornotes').countDocuments();
    report.counts.progressRecords = await db.collection('progressrecords').countDocuments();
    report.counts.mealTemplates = await db.collection('mealtemplates').countDocuments();

    // D & E. Doctor Recovery Manifest & Related Data
    const doctorUsers = await db.collection('users').find({ role: 'doctor' }).toArray();
    for (const u of doctorUsers) {
      const profile = await db.collection('doctors').findOne({ userId: u._id });
      
      const patients = await db.collection('patients').find({ assignedDoctor: u._id }).toArray();
      const patientIds = patients.map(p => p._id);
      const userIds = patients.map(p => p.userId);
      
      const relatedUsers = userIds.length ? await db.collection('users').find({ _id: { $in: userIds } }).project({ _id: 1, fullName: 1 }).toArray() : [];
      
      const appointments = await db.collection('appointments').find({ doctorId: u._id }).project({ _id: 1 }).toArray();
      const assessments = await db.collection('assessments').find({ doctorId: u._id }).project({ _id: 1 }).toArray();
      const mealPlans = await db.collection('mealplans').find({ doctorId: u._id }).project({ _id: 1 }).toArray();
      const doctorNotes = await db.collection('doctornotes').find({ doctorId: u._id }).project({ _id: 1 }).toArray();
      
      const progressRecords = patientIds.length ? await db.collection('progressrecords').find({ patientId: { $in: patientIds } }).project({ _id: 1 }).toArray() : [];

      let classification = "Uncertain — manual review required";
      if (u.email === 'kavindunageeshan98@gmail.com' || u.email === 'pasindu@gmail.com') {
        classification = "Genuine Doctor";
      } else if (u.email.includes('test_admin_doc_') || u.email.includes('test_p2') || u.email.includes('testPhase3') || u.fullName.includes('Test Active') || u.fullName.includes('Test Inactive') || u.fullName.includes('Test Doctor A') || u.fullName.includes('Test Doctor B')) {
        classification = "Clearly identified Phase 2/Phase 3 Test Doctor";
      }

      report.doctors.push({
        userId: u._id,
        name: u.fullName,
        email: u.email,
        profileExists: !!profile,
        assignedPatientCount: patients.length,
        appointmentCount: appointments.length,
        assessmentCount: assessments.length,
        mealPlanCount: mealPlans.length,
        doctorNoteCount: doctorNotes.length,
        classification: classification
      });

      if (classification === "Clearly identified Phase 2/Phase 3 Test Doctor") {
        report.relatedData.push({
          testDoctorUserId: u._id,
          profileId: profile ? profile._id : null,
          assignedPatientProfileIds: patients.map(p => p._id),
          relatedPatientUsers: relatedUsers.map(ru => ({ id: ru._id, name: ru.fullName })),
          appointmentIds: appointments.map(a => a._id),
          assessmentIds: assessments.map(a => a._id),
          mealPlanIds: mealPlans.map(m => m._id),
          doctorNoteIds: doctorNotes.map(n => n._id),
          progressRecordIds: progressRecords.map(pr => pr._id)
        });
      }
    }

    console.log(JSON.stringify(report, null, 2));
    process.exit(0);
  } catch (err) {
    console.error(err);
    process.exit(1);
  }
}

run();
