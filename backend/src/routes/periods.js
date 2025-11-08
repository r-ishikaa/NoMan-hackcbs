import express from "express";
import Period from "../models/Period.js";
import PeriodLog from "../models/PeriodLog.js";
import { authenticateToken } from "../middleware/auth.js";

const router = express.Router();

// Get or create user's period settings
router.get("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    
    let period = await Period.findOne({ userId });
    
    if (!period) {
      // Create default period settings
      period = await Period.create({
        userId,
        cycleLength: 28,
        periodLength: 5,
        flow: "medium",
      });
    }
    
    res.json(period);
  } catch (err) {
    console.error("GET /periods error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Update user's period settings
router.put("/", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { cycleLength, periodLength, lastPeriodDate, flow, currentCycleStartDate } = req.body;
    
    let period = await Period.findOne({ userId });
    
    const updateData = {};
    if (cycleLength !== undefined) updateData.cycleLength = cycleLength;
    if (periodLength !== undefined) updateData.periodLength = periodLength;
    if (flow !== undefined) updateData.flow = flow;
    
    // Only update lastPeriodDate if explicitly provided and different
    // This preserves historical data when just updating cycle/period length
    if (lastPeriodDate !== undefined) {
      updateData.lastPeriodDate = lastPeriodDate ? new Date(lastPeriodDate) : null;
    }
    
    // Only update currentCycleStartDate if:
    // 1. It's explicitly provided in the request, OR
    // 2. Period doesn't exist yet, OR
    // 3. Last period date is being changed (new period start)
    if (currentCycleStartDate !== undefined) {
      updateData.currentCycleStartDate = currentCycleStartDate ? new Date(currentCycleStartDate) : null;
    } else if (!period && lastPeriodDate) {
      // First time setup - use lastPeriodDate as cycle start
      updateData.currentCycleStartDate = new Date(lastPeriodDate);
    } else if (period && lastPeriodDate && period.lastPeriodDate) {
      // If lastPeriodDate is being changed, check if it's different
      const oldLastPeriod = new Date(period.lastPeriodDate);
      const newLastPeriod = new Date(lastPeriodDate);
      if (oldLastPeriod.getTime() !== newLastPeriod.getTime()) {
        // Last period date changed - update cycle start to new date
        updateData.currentCycleStartDate = newLastPeriod;
      }
      // Otherwise, keep existing currentCycleStartDate (don't change it)
    }
    
    if (period) {
      // Update existing - preserve currentCycleStartDate if not being updated
      // This ensures historical predictions remain unchanged
      Object.assign(period, updateData);
      await period.save();
    } else {
      // Create new
      period = await Period.create({
        userId,
        cycleLength: cycleLength || 28,
        periodLength: periodLength || 5,
        lastPeriodDate: lastPeriodDate ? new Date(lastPeriodDate) : null,
        flow: flow || "medium",
        currentCycleStartDate: updateData.currentCycleStartDate || (lastPeriodDate ? new Date(lastPeriodDate) : null),
      });
    }
    
    res.json(period);
  } catch (err) {
    console.error("PUT /periods error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Get period logs for a date range
router.get("/logs", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { startDate, endDate } = req.query;
    
    const query = { userId };
    
    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    }
    
    const logs = await PeriodLog.find(query).sort({ date: -1 });
    res.json(logs);
  } catch (err) {
    console.error("GET /periods/logs error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Log period for a specific date
router.post("/logs", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { date, hasPeriod, periodDay, flow, mood, symptoms, notes } = req.body;
    
    if (!date) {
      return res.status(400).json({ error: "Date is required" });
    }
    
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0); // Set to start of day
    
    // Get period settings to know period length
    const period = await Period.findOne({ userId });
    if (!period) {
      return res.status(404).json({ error: "Period settings not found. Please set up your period tracking first." });
    }
    
    // Check if log already exists
    let log = await PeriodLog.findOne({ userId, date: logDate });
    
    if (log) {
      // Update existing log
      if (hasPeriod !== undefined) log.hasPeriod = hasPeriod;
      if (periodDay !== undefined) log.periodDay = periodDay;
      if (flow !== undefined) log.flow = flow;
      if (mood !== undefined) log.mood = mood;
      if (symptoms !== undefined) log.symptoms = symptoms;
      if (notes !== undefined) log.notes = notes;
      await log.save();
    } else {
      // Create new log
      log = await PeriodLog.create({
        userId,
        date: logDate,
        hasPeriod: hasPeriod || false,
        periodDay: periodDay || null,
        flow: flow || null,
        mood: mood || null,
        symptoms: symptoms || [],
        notes: notes || null,
      });
    }
    
    // If this is a period start (periodDay === 1 and hasPeriod is true), 
    // automatically create logs for the remaining days of the period
    if (hasPeriod && periodDay === 1) {
      // Update period settings
      period.lastPeriodDate = logDate;
      period.currentCycleStartDate = logDate;
      await period.save();
      
      const periodLength = period.periodLength || 5;
      const createdLogs = [log];
      
      // Create logs for days 2, 3, 4, etc. up to periodLength
      for (let day = 2; day <= periodLength; day++) {
        const nextDate = new Date(logDate);
        nextDate.setDate(nextDate.getDate() + (day - 1));
        nextDate.setHours(0, 0, 0, 0);
        
        // Check if log already exists for this date
        const existingLog = await PeriodLog.findOne({ userId, date: nextDate });
        
        if (!existingLog) {
          // Create automatic log for this day
          try {
            const autoLog = await PeriodLog.create({
              userId,
              date: nextDate,
              hasPeriod: true,
              periodDay: day,
              flow: flow || null, // Use the same flow as day 1
              mood: null,
              symptoms: [],
              notes: null,
            });
            createdLogs.push(autoLog);
          } catch (createErr) {
            // If duplicate key error, log already exists (skip)
            if (createErr.code !== 11000) {
              console.error(`Error creating auto log for day ${day}:`, createErr);
            }
          }
        } else if (!existingLog.hasPeriod) {
          // Update existing log to mark as period day
          existingLog.hasPeriod = true;
          existingLog.periodDay = day;
          if (flow) existingLog.flow = flow;
          await existingLog.save();
          createdLogs.push(existingLog);
        }
      }
      
      return res.json({
        log,
        autoCreatedLogs: createdLogs.slice(1), // Return all logs except the first one
        message: `Period logged for ${periodLength} days starting from ${logDate.toISOString().split('T')[0]}`,
      });
    }
    
    res.json(log);
  } catch (err) {
    if (err.code === 11000) {
      return res.status(400).json({ error: "Period log already exists for this date" });
    }
    console.error("POST /periods/logs error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Delete period log for a date
router.delete("/logs/:date", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const { date } = req.params;
    
    const logDate = new Date(date);
    logDate.setHours(0, 0, 0, 0);
    
    const log = await PeriodLog.findOneAndDelete({ userId, date: logDate });
    
    if (!log) {
      return res.status(404).json({ error: "Period log not found" });
    }
    
    res.json({ message: "Period log deleted successfully" });
  } catch (err) {
    console.error("DELETE /periods/logs/:date error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

// Get cycle predictions and summary
router.get("/summary", authenticateToken, async (req, res) => {
  try {
    const userId = req.user._id;
    const period = await Period.findOne({ userId });
    
    if (!period) {
      return res.status(404).json({ error: "Period settings not found. Please set up your period tracking first." });
    }
    
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    
    // Get the most recent period log to determine current cycle
    const recentLogs = await PeriodLog.find({
      userId,
      hasPeriod: true,
    })
      .sort({ date: -1 })
      .limit(10);
    
    let cycleStartDate = null;
    let currentCycleDay = null;
    let nextPeriodDate = null;
    
    if (recentLogs.length > 0) {
      // Find the most recent period start (day 1)
      const periodStartLog = recentLogs.find(log => log.periodDay === 1);
      if (periodStartLog) {
        cycleStartDate = new Date(periodStartLog.date);
        cycleStartDate.setHours(0, 0, 0, 0);
        
        // Update period settings with this cycle start
        if (!period.currentCycleStartDate || 
            new Date(period.currentCycleStartDate).getTime() !== cycleStartDate.getTime()) {
          period.currentCycleStartDate = cycleStartDate;
          period.lastPeriodDate = cycleStartDate;
          await period.save();
        }
      } else {
        // If no day 1 log, use the earliest log in the recent set as period start
        const earliestRecentLog = recentLogs[recentLogs.length - 1];
        cycleStartDate = new Date(earliestRecentLog.date);
        cycleStartDate.setDate(cycleStartDate.getDate() - (earliestRecentLog.periodDay - 1));
        cycleStartDate.setHours(0, 0, 0, 0);
      }
    } else if (period.currentCycleStartDate) {
      // Use stored cycle start date
      cycleStartDate = new Date(period.currentCycleStartDate);
      cycleStartDate.setHours(0, 0, 0, 0);
    } else if (period.lastPeriodDate) {
      // Use last period date as cycle start
      cycleStartDate = new Date(period.lastPeriodDate);
      cycleStartDate.setHours(0, 0, 0, 0);
    }
    
    if (cycleStartDate) {
      // Calculate current cycle day
      const daysSinceCycleStart = Math.floor((today - cycleStartDate) / (1000 * 60 * 60 * 24));
      
      // Check if we're currently on period (check today's log)
      const todayLog = recentLogs.find(log => {
        const logDate = new Date(log.date);
        logDate.setHours(0, 0, 0, 0);
        return logDate.getTime() === today.getTime();
      });
      
      if (todayLog && todayLog.hasPeriod && todayLog.periodDay) {
        // User is on period today - show period day
        currentCycleDay = todayLog.periodDay;
      } else if (daysSinceCycleStart >= 0 && daysSinceCycleStart < period.cycleLength) {
        // Show cycle day if within cycle
        currentCycleDay = daysSinceCycleStart + 1;
      }
      
      // Calculate next period date
      nextPeriodDate = new Date(cycleStartDate);
      nextPeriodDate.setDate(nextPeriodDate.getDate() + period.cycleLength);
      
      // If next period is in the past, calculate the next one
      while (nextPeriodDate < today) {
        nextPeriodDate.setDate(nextPeriodDate.getDate() + period.cycleLength);
      }
    }
    
    // Get period logs for the most recent cycle to calculate period length
    let actualPeriodLength = period.periodLength;
    if (cycleStartDate) {
      const cycleEndDate = new Date(cycleStartDate);
      cycleEndDate.setDate(cycleEndDate.getDate() + period.cycleLength);
      
      const periodLogs = await PeriodLog.find({
        userId,
        date: {
          $gte: cycleStartDate,
          $lte: cycleEndDate,
        },
        hasPeriod: true,
      }).sort({ date: 1 });
      
      if (periodLogs.length > 0) {
        actualPeriodLength = periodLogs.length;
      }
    }
    
    res.json({
      cycleLength: period.cycleLength,
      periodLength: actualPeriodLength,
      nextPeriodDate: nextPeriodDate ? nextPeriodDate.toISOString().split('T')[0] : null,
      currentCycleDay: currentCycleDay,
      cycleStartDate: cycleStartDate ? cycleStartDate.toISOString().split('T')[0] : null,
      lastPeriodDate: period.lastPeriodDate ? new Date(period.lastPeriodDate).toISOString().split('T')[0] : null,
    });
  } catch (err) {
    console.error("GET /periods/summary error:", err);
    res.status(500).json({ error: err.message || "Internal server error" });
  }
});

export default router;

