const mongoose = require('mongoose');

const excelDataSchema = new mongoose.Schema({
  type: {
    type: String,
    required: true,
    enum: ['Routine','SemesterResult']
  },
  filePath: {
    type: String,
    required: true
  },
  uploadDate: {
    type: Date,
    default: Date.now
  },
});

const ExcelData = mongoose.model('ExcelData', excelDataSchema);

module.exports = ExcelData;
