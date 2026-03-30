const AuditLog = require('../models/AuditLog');
const User = require('../models/User');

const logAudit = async (supabaseUserId, action, details, resourceId = null, resourceType = null) => {
  try {
    const user = await User.findOne({ supabaseUserId });
    if (!user) {
      console.warn(`User with Supabase ID ${supabaseUserId} not found for audit logging.`);
      return;
    }

    const auditEntry = new AuditLog({
      action,
      performedBy: user._id,
      details,
      resourceId,
      resourceType,
    });

    await auditEntry.save();
  } catch (err) {
    console.error('Error saving audit log:', err);
  }
};

module.exports = { logAudit };
