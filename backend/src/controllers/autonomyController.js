import { supervisorAgent } from '../agents/supervisorAgent.js';

export const getAutonomySettings = async (req, res, next) => {
  try {
    const settings = supervisorAgent.getAutonomySettings();
    return res.json(settings);
  } catch (err) {
    next(err);
  }
};

export const updateAutonomySettings = async (req, res, next) => {
  try {
    const updates = req.body;
    const updated = supervisorAgent.updateAutonomySettings(updates, req.user);
    return res.json({
      success: true,
      message: 'Autonomous AI Mode settings successfully updated.',
      settings: updated
    });
  } catch (err) {
    next(err);
  }
};

export const enableAutonomousMode = async (req, res, next) => {
  try {
    const updated = supervisorAgent.updateAutonomySettings({
      enabled: true,
      paused: false,
      emergency_stopped: false,
      note: `Autonomous AI Mode explicitly activated by ${req.user.name}`
    }, req.user);

    return res.json({
      success: true,
      message: 'Autonomous AI Mode successfully ENABLED. Supervisor is authorized to execute policy-bounded workflows.',
      settings: updated
    });
  } catch (err) {
    next(err);
  }
};

export const disableAutonomousMode = async (req, res, next) => {
  try {
    const updated = supervisorAgent.updateAutonomySettings({
      enabled: false,
      paused: false,
      note: `Autonomous AI Mode disabled by ${req.user.name}. Reverted to human-supervised gating.`
    }, req.user);

    return res.json({
      success: true,
      message: 'Autonomous AI Mode DISABLED. All sensitive actions require human supervisor authorization.',
      settings: updated
    });
  } catch (err) {
    next(err);
  }
};

export const pauseAutonomousMode = async (req, res, next) => {
  try {
    const updated = supervisorAgent.updateAutonomySettings({
      paused: true,
      note: `Autonomous actions paused by ${req.user.name}`
    }, req.user);

    return res.json({
      success: true,
      message: 'Autonomous execution PAUSED. Supervisor is actively monitoring without executing actions.',
      settings: updated
    });
  } catch (err) {
    next(err);
  }
};

export const resumeAutonomousMode = async (req, res, next) => {
  try {
    const updated = supervisorAgent.updateAutonomySettings({
      paused: false,
      note: `Autonomous execution resumed by ${req.user.name}`
    }, req.user);

    return res.json({
      success: true,
      message: 'Autonomous execution RESUMED.',
      settings: updated
    });
  } catch (err) {
    next(err);
  }
};

export const emergencyStop = async (req, res, next) => {
  try {
    const updated = supervisorAgent.emergencyStop(req.user);

    return res.json({
      success: true,
      message: 'EMERGENCY STOP EXECUTED. All autonomous action execution immediately halted.',
      settings: updated
    });
  } catch (err) {
    next(err);
  }
};
