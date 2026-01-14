const mongoose = require('mongoose');
// Use the URI directly to avoid dotenv issues
const uri = "mongodb+srv://Aditya:Aditya%401234@flexpass.mqx9nms.mongodb.net/?appName=Flexpass";

mongoose.connect(uri)
  .then(async () => {
    console.log('Connected to MongoDB');
    
    // Define Schema/Model minimally to avoid require loops or missing files
    const passSchema = new mongoose.Schema({}, { strict: false });
    const Pass = mongoose.model('Pass', passSchema);
    
    const usageLogSchema = new mongoose.Schema({}, { strict: false });
    const UsageLog = mongoose.model('UsageLog', usageLogSchema);

    // Delete
    console.log('Deleting Passes...');
    const p = await Pass.deleteMany({});
    console.log(`Deleted ${p.deletedCount} passes.`);

    console.log('Deleting UsageLogs...');
    const u = await UsageLog.deleteMany({});
    console.log(`Deleted ${u.deletedCount} usage logs.`);

    console.log('Cleanup Complete.');
    process.exit(0);
  })
  .catch(err => {
    console.error('Connection Error:', err);
    process.exit(1);
  });
