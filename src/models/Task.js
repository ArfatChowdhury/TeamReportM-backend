const mongoose = require('mongoose');

const taskSchema = new mongoose.Schema({
  title: { 
    type: String, 
    required: true 
  },
  description: { 
    type: String, 
    default: '' 
  },
  project: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Project', 
    required: true 
  },
  assignedTo: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: false 
  },
  assignedBy: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  status: { 
    type: String, 
    enum: ['todo', 'in-progress', 'pause', 'done'], 
    default: 'todo' 
  },
  startedAt: { 
    type: Date, 
    default: null 
  },
  completedAt: { 
    type: Date, 
    default: null 
  },
  timeTracked: { 
    type: Number, 
    default: 0 // In minutes
  },
  isCarryOver: { 
    type: Boolean, 
    default: false 
  },
  isLocked: {
    type: Boolean,
    default: false
  },
  originalTask: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Task', 
    default: null 
  },
  dueDate: { 
    type: Date, 
    default: null 
  },
}, { timestamps: true });

module.exports = mongoose.model('Task', taskSchema);
