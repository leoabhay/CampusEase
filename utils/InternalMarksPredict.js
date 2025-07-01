const Assignment = require('../models/giveAssignmentModel');
const AnswerAssignment = require('../models/answerAssignmentModel');
const InternalMarks = require('../models/internalMarks-calculationModel');

async function calculateAndUpdateInternalMarks() {
    try {
        const assignments = await Assignment.find();

        for (const assignment of assignments) {
            const submissions = await AnswerAssignment.find({ assignment: assignment.assignmentName });

            const assignmentMarks = submissions.length * 20; // Each assignment contributes 20 marks

            for (const submission of submissions) {
                await InternalMarks.findOneAndUpdate(
                    { rollno: submission.rollno, subject: submission.subject },
                    { $inc: { assignmentMarks } }, // Increment assignmentMarks
                    { upsert: true, new: true }
                );
            }
        }

        const students = await InternalMarks.find();
        for (const student of students) {
            const attendanceMarks = 10; 
            await InternalMarks.findOneAndUpdate(
                { rollno: student.rollno, subject: student.subject },
                { $inc: { attendanceMarks } },
                { upsert: true, new: true }
            );
        }

    } catch (error) {
        console.error('Error calculating internal marks:', error);
        throw error;
    }
}

module.exports = calculateAndUpdateInternalMarks;