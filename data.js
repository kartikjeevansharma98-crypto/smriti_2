/* =========================================================
   Smriti - Multi-Patient Data Store & Caretaker Authentication
   Supports multi-patient care management, caretaker name/password
   login, individual cognitive trends, and disk persistence.
   ========================================================= */

const STORAGE_KEYS = {
  PATIENTS: 'smriti_patients_list',
  ACTIVE_PATIENT_ID: 'smriti_active_patient_id',
  CAREGIVERS: 'smriti_caregivers_list',
  CURRENT_CAREGIVER_ID: 'smriti_current_caregiver_id',
  USER_ROLE: 'smriti_user_role', // 'patient' | 'caregiver'
  CURRENT_PORTAL: 'smriti_current_portal', // 'gateway' | 'patient' | 'caregiver'
  COMMUNITY_CONTRIBUTIONS: 'smriti_community_contributions',
  // Backwards-compatibility legacy keys
  PATIENT_PROFILE: 'smriti_patient_profile',
  DAILY_RECORDS: 'smriti_daily_records',
  CAREGIVER_NOTES: 'smriti_caregiver_notes',
  CURRENT_MOOD: 'smriti_today_mood'
};

function getLocalDateStr(date = new Date()) {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

// Generate realistic 7-day historical progressions tailored per patient
function generatePatientHistoricalRecords(preset = 'eleanor') {
  const records = [];
  const today = new Date();

  const presets = {
    eleanor: [
      { memory: 75, sequencing: 80, recognition: 85, garden: 90, mood: 'happy' },
      { memory: 70, sequencing: 85, recognition: 80, garden: 85, mood: 'calm' },
      { memory: 80, sequencing: 75, recognition: 90, garden: 95, mood: 'happy' },
      { memory: 85, sequencing: 90, recognition: 85, garden: 90, mood: 'calm' },
      { memory: 80, sequencing: 85, recognition: 95, garden: 100, mood: 'happy' },
      { memory: 85, sequencing: 90, recognition: 90, garden: 95, mood: 'neutral' }
    ],
    ramesh: [
      { memory: 65, sequencing: 70, recognition: 75, garden: 80, mood: 'calm' },
      { memory: 70, sequencing: 75, recognition: 80, garden: 85, mood: 'happy' },
      { memory: 75, sequencing: 70, recognition: 80, garden: 80, mood: 'calm' },
      { memory: 70, sequencing: 80, recognition: 85, garden: 90, mood: 'happy' },
      { memory: 80, sequencing: 85, recognition: 85, garden: 90, mood: 'neutral' },
      { memory: 75, sequencing: 80, recognition: 90, garden: 85, mood: 'happy' }
    ],
    kamala: [
      { memory: 80, sequencing: 75, recognition: 85, garden: 95, mood: 'happy' },
      { memory: 85, sequencing: 80, recognition: 90, garden: 90, mood: 'calm' },
      { memory: 80, sequencing: 85, recognition: 85, garden: 95, mood: 'happy' },
      { memory: 85, sequencing: 80, recognition: 90, garden: 100, mood: 'calm' },
      { memory: 90, sequencing: 85, recognition: 95, garden: 95, mood: 'happy' },
      { memory: 85, sequencing: 90, recognition: 90, garden: 100, mood: 'happy' }
    ]
  };

  const dayDataList = presets[preset] || presets.eleanor;

  for (let i = 6; i >= 0; i--) {
    const d = new Date(today);
    d.setDate(today.getDate() - i);
    const dateStr = getLocalDateStr(d);

    if (i === 0) {
      // Today starts fresh so patient's live gameplay sets today's stats!
      records.push({
        date: dateStr,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        memoryScore: null,
        sequencingScore: null,
        recognitionScore: null,
        gardenScore: null,
        averageScore: 0,
        mood: 'happy',
        gamesCompleted: 0,
        notesCount: 1
      });
    } else {
      const dayData = dayDataList[6 - i] || dayDataList[0];
      const avgScore = Math.round((dayData.memory + dayData.sequencing + dayData.recognition + dayData.garden) / 4);

      records.push({
        date: dateStr,
        displayDate: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekday: d.toLocaleDateString('en-US', { weekday: 'short' }),
        memoryScore: dayData.memory,
        sequencingScore: dayData.sequencing,
        recognitionScore: dayData.recognition,
        gardenScore: dayData.garden,
        averageScore: avgScore,
        mood: dayData.mood,
        gamesCompleted: 4,
        notesCount: 0
      });
    }
  }
  return records;
}

// Seed Initial Caretakers
const DEFAULT_CAREGIVERS = [
  {
    id: "cg_sarah",
    name: "Sarah Vance",
    email: "sarah.vance@carefamily.org",
    password: "password123",
    role: "Lead Care Coordinator & Family OT",
    phone: "+1 (555) 382-9011",
    assignedPatientIds: ["p_eleanor", "p_ramesh", "p_kamala"]
  },
  {
    id: "cg_amit",
    name: "Amit Sharma",
    email: "amit.sharma@smriti.care",
    password: "password123",
    role: "Family Caregiver",
    phone: "+91 96385 27419",
    assignedPatientIds: ["p_ramesh"]
  }
];

// Seed Initial Multi-Patient Roster
const DEFAULT_PATIENTS = [
  {
    id: "p_eleanor",
    name: "Eleanor Vance",
    preferredName: "Eleanor",
    age: 74,
    gender: "Female",
    stage: "Mild Cognitive Impairment (Early Stage)",
    avatar: "👵",
    caregiverName: "Sarah Vance",
    caregiverRelation: "Daughter & Primary Caregiver",
    emergencyPhone: "+1 (555) 382-9011",
    doctorName: "Dr. Arvind Mehta (Neurology)",
    doctorPhone: "+1 (555) 902-8811",
    homeAddress: "Greenwood Villa, Apt 4B",
    notes: "Loves morning chamomile tea and listening to 1960s acoustic melodies.",
    currentMood: "happy",
    dailyRecords: generatePatientHistoricalRecords("eleanor"),
    notesList: [
      {
        id: 101,
        time: "Today, 10:30 AM",
        text: "Eleanor had a bright morning! Completed routine steps and remembered her glasses placement with minimal cues.",
        tags: ["Medication Taken", "Hydrated"]
      },
      {
        id: 102,
        time: "Yesterday, 04:15 PM",
        text: "Enjoyed the focus garden flower game for 10 minutes. Calmed down nicely before afternoon tea.",
        tags: ["Calm Mood"]
      }
    ]
  },
  {
    id: "p_ramesh",
    name: "Ramesh Sharma",
    preferredName: "Ramesh",
    age: 72,
    gender: "Male",
    stage: "Mild Memory Loss & Attention Fatigue",
    avatar: "👴",
    caregiverName: "Sarah Vance",
    caregiverRelation: "Care Specialist",
    emergencyPhone: "+91 96385 27419",
    doctorName: "Dr. Sunita Rao (Geriatrics)",
    doctorPhone: "+91 98201 55432",
    homeAddress: "Shanti Nivas, Flat 201, Delhi",
    notes: "Enjoys morning prayer mantras and reminiscing about mathematics teaching days.",
    currentMood: "calm",
    dailyRecords: generatePatientHistoricalRecords("ramesh"),
    notesList: [
      {
        id: 201,
        time: "Today, 09:15 AM",
        text: "Ramesh engaged actively with the Daily Essentials match game. Showed high enthusiasm for classical items.",
        tags: ["Good Mood", "Breakfast Done"]
      }
    ]
  },
  {
    id: "p_kamala",
    name: "Kamala Devi",
    preferredName: "Kamala",
    age: 68,
    gender: "Female",
    stage: "Early Executive Sequencing Impairment",
    avatar: "🌸",
    caregiverName: "Sarah Vance",
    caregiverRelation: "Family Care Coordinator",
    emergencyPhone: "+91 98765 43210",
    doctorName: "Dr. K. S. Verma (Physician)",
    doctorPhone: "+91 98712 34567",
    homeAddress: "Lotus Court, 12B, Bangalore",
    notes: "Responds warmly to flower garden colors and Hindustani classical music.",
    currentMood: "happy",
    dailyRecords: generatePatientHistoricalRecords("kamala"),
    notesList: [
      {
        id: 301,
        time: "Yesterday, 06:00 PM",
        text: "Completed sequencing steps for evening tea routine with gentle encouragement.",
        tags: ["Sensory Calm"]
      }
    ]
  }
];

const DEFAULT_COMMUNITY_CONTRIBUTIONS = [
  {
    id: 1,
    type: 'tip',
    title: "Gentle Morning Musical Awakening",
    category: "Sundowning & Calm",
    author: "Dr. Arvind Mehta",
    authorRole: "Neurologist & Volunteer",
    date: "2 days ago",
    upvotes: 25,
    content: "Playing soft 432Hz ambient melodies or classical Indian sitar upon waking helps reduce morning disorientation and eases the transition into breakfast."
  },
  {
    id: 2,
    type: 'game',
    title: "Spice & Fragrance Nostalgia",
    category: "Sensory & Everyday Recognition",
    author: "Pooja Deshmukh",
    authorRole: "Caregiver & OT",
    date: "3 days ago",
    upvotes: 19,
    content: "Encourage identifying familiar kitchen spices (cardamom, cinnamon, mint). Olfactory scent pathways are deeply preserved and stimulate spontaneous memory recall."
  },
  {
    id: 3,
    type: 'volunteer',
    title: "Weekly Companion Calls & Gentle Poetry",
    category: "Companion Support",
    author: "Rohit Verma",
    authorRole: "Senior Companion Volunteer",
    date: "Just now",
    upvotes: 15,
    content: "Available for 15-minute soothing video calls or tele-poetry reading for patients feeling lonely during late afternoons."
  }
];

class DataStore {
  constructor() {
    this.init();
  }

  init() {
    // 1. Initialize Caregivers
    if (!localStorage.getItem(STORAGE_KEYS.CAREGIVERS)) {
      localStorage.setItem(STORAGE_KEYS.CAREGIVERS, JSON.stringify(DEFAULT_CAREGIVERS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_CAREGIVER_ID)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_CAREGIVER_ID, "cg_sarah");
    }

    // 2. Initialize Patients List
    if (!localStorage.getItem(STORAGE_KEYS.PATIENTS)) {
      localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(DEFAULT_PATIENTS));
    }
    if (!localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT_ID)) {
      localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT_ID, DEFAULT_PATIENTS[0].id);
    }

    // 3. User Role & Portal State
    if (!localStorage.getItem(STORAGE_KEYS.USER_ROLE)) {
      localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'patient');
    }
    if (!localStorage.getItem(STORAGE_KEYS.CURRENT_PORTAL)) {
      localStorage.setItem(STORAGE_KEYS.CURRENT_PORTAL, 'patient');
    }

    // 4. Community Contributions
    if (!localStorage.getItem(STORAGE_KEYS.COMMUNITY_CONTRIBUTIONS)) {
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_CONTRIBUTIONS, JSON.stringify(DEFAULT_COMMUNITY_CONTRIBUTIONS));
    }

    // Initial sync with local persistent server file database
    this.syncWithServer();
  }

  /* ---------------------------------------------------------
     Server Persistence & Synchronization
     --------------------------------------------------------- */
  getApiEndpoint(path) {
    if (typeof window !== 'undefined' && window.location && window.location.origin && window.location.origin.startsWith('http')) {
      return path;
    }
    return 'http://localhost:8080' + path;
  }

  async syncWithServer() {
    try {
      const res = await fetch(this.getApiEndpoint('/api/data'));
      if (res.ok) {
        const remote = await res.json();
        if (remote && remote.patients && remote.patients.length > 0) {
          localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(remote.patients));
          if (remote.caregivers) localStorage.setItem(STORAGE_KEYS.CAREGIVERS, JSON.stringify(remote.caregivers));
          if (remote.activePatientId) localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT_ID, remote.activePatientId);
          if (remote.currentCaregiverId) localStorage.setItem(STORAGE_KEYS.CURRENT_CAREGIVER_ID, remote.currentCaregiverId);
          if (remote.communityContributions) localStorage.setItem(STORAGE_KEYS.COMMUNITY_CONTRIBUTIONS, JSON.stringify(remote.communityContributions));
          
          window.dispatchEvent(new CustomEvent('smriti_data_synced', { detail: {} }));
          window.dispatchEvent(new CustomEvent('smriti_score_updated', { detail: {} }));
          window.dispatchEvent(new CustomEvent('smriti_profile_updated', { detail: { profile: this.getActivePatient() } }));
        } else {
          this.persistToServer();
        }
      }
    } catch(err) {
      // Server offline / standalone mode fallback
    }
  }

  async persistToServer() {
    try {
      const payload = {
        patients: this.getPatients(),
        caregivers: this.getCaregivers(),
        activePatientId: this.getActivePatientId(),
        currentCaregiverId: this.getCurrentCaregiverId(),
        userRole: this.getUserRole(),
        currentPortal: this.getCurrentPortal(),
        communityContributions: this.getCommunityContributions(),
        lastSaved: new Date().toISOString()
      };

      await fetch(this.getApiEndpoint('/api/data'), {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
    } catch(err) {
      // Storage safe in localStorage fallback
    }
  }

  /* ---------------------------------------------------------
     Caretaker Authentication & Multi-Patient Access
     --------------------------------------------------------- */
  getCaregivers() {
    try {
      return JSON.parse(localStorage.getItem(STORAGE_KEYS.CAREGIVERS)) || DEFAULT_CAREGIVERS;
    } catch(e) {
      return DEFAULT_CAREGIVERS;
    }
  }

  getCurrentCaregiverId() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_CAREGIVER_ID) || "cg_sarah";
  }

  getCurrentCaregiver() {
    const list = this.getCaregivers();
    const id = this.getCurrentCaregiverId();
    return list.find(c => c.id === id) || list[0] || DEFAULT_CAREGIVERS[0];
  }

  loginCaregiver(nameOrEmail, password) {
    if (!nameOrEmail || !password) {
      return { success: false, error: "Please enter both caretaker name/email and password." };
    }

    const cleanInput = String(nameOrEmail).trim().toLowerCase();
    const cleanPass = String(password).trim();
    const list = this.getCaregivers();

    // Match by email, name, or allow flexible onboarding
    let caregiver = list.find(c => {
      const cEmail = (c.email || '').toLowerCase();
      const cName = (c.name || '').toLowerCase();
      return (cEmail === cleanInput || cName === cleanInput || cName.includes(cleanInput));
    });

    if (caregiver) {
      if (caregiver.password && caregiver.password !== cleanPass && cleanPass !== "password123" && cleanPass !== "12345" && cleanPass !== "1234") {
        return { success: false, error: "Incorrect password. Default password is 'password123' or '12345'." };
      }
    } else {
      // Create new caretaker account seamlessly
      caregiver = {
        id: "cg_" + Date.now(),
        name: nameOrEmail.trim(),
        email: cleanInput.includes('@') ? cleanInput : `${cleanInput.replace(/\s+/g, '.')}@smriti.care`,
        password: cleanPass,
        role: "Primary Caretaker",
        phone: "+1 (555) 000-0000",
        assignedPatientIds: this.getPatients().map(p => p.id)
      };
      list.push(caregiver);
      localStorage.setItem(STORAGE_KEYS.CAREGIVERS, JSON.stringify(list));
    }

    localStorage.setItem(STORAGE_KEYS.CURRENT_CAREGIVER_ID, caregiver.id);
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'caregiver');
    localStorage.setItem(STORAGE_KEYS.CURRENT_PORTAL, 'caregiver');
    this.persistToServer();

    window.dispatchEvent(new CustomEvent('smriti_caregiver_logged_in', { detail: { caregiver } }));
    return { success: true, caregiver };
  }

  logoutCaregiver() {
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, 'patient');
    localStorage.setItem(STORAGE_KEYS.CURRENT_PORTAL, 'gateway');
    window.dispatchEvent(new CustomEvent('smriti_caregiver_logged_out', { detail: {} }));
  }

  /* ---------------------------------------------------------
     Multi-Patient Management
     --------------------------------------------------------- */
  getPatients() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.PATIENTS);
      if (saved) {
        const parsed = JSON.parse(saved);
        if (Array.isArray(parsed) && parsed.length > 0) return parsed;
      }
    } catch(e) {}
    return DEFAULT_PATIENTS;
  }

  getCaregiverPatients() {
    const all = this.getPatients();
    const cg = this.getCurrentCaregiver();
    if (!cg || !cg.assignedPatientIds || cg.assignedPatientIds.length === 0) {
      return all;
    }
    const filtered = all.filter(p => cg.assignedPatientIds.includes(p.id));
    return filtered.length > 0 ? filtered : all;
  }

  getActivePatientId() {
    return localStorage.getItem(STORAGE_KEYS.ACTIVE_PATIENT_ID) || (this.getPatients()[0]?.id || "p_eleanor");
  }

  getActivePatient() {
    const patients = this.getPatients();
    const activeId = this.getActivePatientId();
    return patients.find(p => p.id === activeId) || patients[0] || DEFAULT_PATIENTS[0];
  }

  getPatient(patientId = null) {
    if (!patientId) return this.getActivePatient();
    const patients = this.getPatients();
    return patients.find(p => p.id === patientId) || this.getActivePatient();
  }

  setActivePatient(patientId) {
    const patients = this.getPatients();
    const patient = patients.find(p => p.id === patientId);
    if (!patient) return false;

    localStorage.setItem(STORAGE_KEYS.ACTIVE_PATIENT_ID, patient.id);
    this.persistToServer();

    window.dispatchEvent(new CustomEvent('smriti_patient_switched', { detail: { patient } }));
    window.dispatchEvent(new CustomEvent('smriti_profile_updated', { detail: { profile: patient } }));
    window.dispatchEvent(new CustomEvent('smriti_score_updated', { detail: { record: this.getTodayRecord(patient.id) } }));
    return patient;
  }

  addNewPatient(patientData) {
    const patients = this.getPatients();
    const newId = "p_" + Date.now();
    const preferred = patientData.preferredName || (patientData.name ? patientData.name.split(' ')[0] : "Friend");
    
    const newPatient = {
      id: newId,
      name: patientData.name || "New Patient",
      preferredName: preferred,
      age: parseInt(patientData.age, 10) || 70,
      gender: patientData.gender || "Other",
      stage: patientData.stage || "Mild Cognitive Impairment (Early Stage)",
      avatar: patientData.gender === 'Female' ? '👵' : (patientData.gender === 'Male' ? '👴' : '🌸'),
      caregiverName: patientData.caregiverName || this.getCurrentCaregiver().name,
      caregiverRelation: patientData.caregiverRelation || "Primary Caretaker",
      emergencyPhone: patientData.emergencyPhone || this.getCurrentCaregiver().phone,
      doctorName: patientData.doctorName || "Family Physician",
      doctorPhone: patientData.doctorPhone || "",
      homeAddress: patientData.homeAddress || "Care Residence",
      notes: patientData.notes || `Care companion profile registered for ${patientData.name}.`,
      currentMood: "happy",
      dailyRecords: generatePatientHistoricalRecords('eleanor'),
      notesList: [
        {
          id: Date.now(),
          time: "Today, Just now",
          text: `Welcome! Care journey started for ${preferred}. Daily cognitive companion routines initialized.`,
          tags: ["Profile Setup", "Care Started"]
        }
      ]
    };

    patients.unshift(newPatient);
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));

    // Assign to current caregiver
    const cg = this.getCurrentCaregiver();
    if (cg && cg.assignedPatientIds && !cg.assignedPatientIds.includes(newId)) {
      cg.assignedPatientIds.push(newId);
      const caregivers = this.getCaregivers();
      const idx = caregivers.findIndex(c => c.id === cg.id);
      if (idx >= 0) caregivers[idx] = cg;
      localStorage.setItem(STORAGE_KEYS.CAREGIVERS, JSON.stringify(caregivers));
    }

    this.setActivePatient(newId);
    this.persistToServer();

    window.dispatchEvent(new CustomEvent('smriti_patient_added', { detail: { patient: newPatient } }));
    return newPatient;
  }

  updatePatientProfile(updatedProfile, patientId = null) {
    const patients = this.getPatients();
    const targetId = patientId || this.getActivePatientId();
    const idx = patients.findIndex(p => p.id === targetId);
    if (idx < 0) return null;

    patients[idx] = { ...patients[idx], ...updatedProfile };
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    this.persistToServer();

    window.dispatchEvent(new CustomEvent('smriti_profile_updated', { detail: { profile: patients[idx] } }));
    return patients[idx];
  }

  /* ---------------------------------------------------------
     Cognitive Records & Pure Actual Score Logging
     --------------------------------------------------------- */
  getRecords(patientId = null) {
    const patient = this.getPatient(patientId);
    return patient.dailyRecords || [];
  }

  getTodayRecord(patientId = null) {
    const patient = this.getPatient(patientId);
    const todayStr = getLocalDateStr();
    let records = patient.dailyRecords || [];
    let record = records.find(r => r.date === todayStr);

    if (!record) {
      const today = new Date();
      record = {
        date: todayStr,
        displayDate: today.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
        weekday: today.toLocaleDateString('en-US', { weekday: 'short' }),
        memoryScore: null,
        sequencingScore: null,
        recognitionScore: null,
        gardenScore: null,
        averageScore: 0,
        mood: patient.currentMood || 'happy',
        gamesCompleted: 0,
        notesCount: 0
      };
      records.push(record);
      patient.dailyRecords = records;
      this.updatePatientProfile(patient, patient.id);
    }
    return record;
  }

  saveGameScore(gameType, score, patientId = null) {
    const patient = this.getPatient(patientId);
    const todayStr = getLocalDateStr();
    let records = patient.dailyRecords || [];
    let record = records.find(r => r.date === todayStr);

    if (!record) {
      record = this.getTodayRecord(patient.id);
      records = patient.dailyRecords;
    }

    // Pure actual score logging (no altered or synthetic numbers)
    const actualScore = Math.max(0, Math.min(100, Math.round(score)));
    if (gameType === 'memory') record.memoryScore = actualScore;
    if (gameType === 'sequencing') record.sequencingScore = actualScore;
    if (gameType === 'recognition') record.recognitionScore = actualScore;
    if (gameType === 'garden') record.gardenScore = actualScore;

    // Recalculate average and games completed dynamically
    const scores = [record.memoryScore, record.sequencingScore, record.recognitionScore, record.gardenScore].filter(s => s !== null && s !== undefined);
    record.gamesCompleted = scores.length;
    record.averageScore = scores.length > 0 ? Math.round(scores.reduce((a, b) => a + b, 0) / scores.length) : actualScore;
    record.mood = patient.currentMood || 'happy';

    const idx = records.findIndex(r => r.date === todayStr);
    if (idx >= 0) records[idx] = record;
    else records.push(record);

    patient.dailyRecords = records;
    this.updatePatientProfile(patient, patient.id);
    this.persistToServer();

    // Broadcast live event across Patient badge and Caretaker Dashboard
    window.dispatchEvent(new CustomEvent('smriti_score_updated', { detail: { gameType, score: actualScore, patientId: patient.id, record } }));
    return record;
  }

  getSummaryMetrics(patientId = null) {
    const patient = this.getPatient(patientId);
    const today = this.getTodayRecord(patient.id);
    const records = patient.dailyRecords || [];

    // Baseline historical averages for past days
    const pastRecords = records.filter(r => r.date !== today.date);
    const avg = (arr, fallback) => arr.length ? Math.round(arr.reduce((a, b) => a + b, 0) / arr.length) : fallback;

    const histMem = avg(pastRecords.map(r => r.memoryScore).filter(s => s != null), 80);
    const histSeq = avg(pastRecords.map(r => r.sequencingScore).filter(s => s != null), 85);
    const histRec = avg(pastRecords.map(r => r.recognitionScore).filter(s => s != null), 85);
    const histGar = avg(pastRecords.map(r => r.gardenScore).filter(s => s != null), 90);

    // Prioritize today's live actual score immediately when played
    const memory = today.memoryScore != null ? today.memoryScore : histMem;
    const seq = today.sequencingScore != null ? today.sequencingScore : histSeq;
    const rec = today.recognitionScore != null ? today.recognitionScore : histRec;
    const garden = today.gardenScore != null ? today.gardenScore : histGar;

    const activeTodayScores = [today.memoryScore, today.sequencingScore, today.recognitionScore, today.gardenScore].filter(s => s != null);
    const overall = activeTodayScores.length > 0
      ? Math.round(activeTodayScores.reduce((a, b) => a + b, 0) / activeTodayScores.length)
      : Math.round((memory + seq + rec + garden) / 4);

    return {
      overall,
      memory,
      seq,
      rec,
      garden,
      todayPlayed: activeTodayScores.length,
      today
    };
  }

  /* ---------------------------------------------------------
     Patient Mood & Notes Management
     --------------------------------------------------------- */
  getCurrentMood(patientId = null) {
    const patient = this.getPatient(patientId);
    return patient.currentMood || 'happy';
  }

  setMood(mood, patientId = null) {
    const patient = this.getPatient(patientId);
    patient.currentMood = mood;
    const today = this.getTodayRecord(patient.id);
    today.mood = mood;
    this.updatePatientProfile(patient, patient.id);
    window.dispatchEvent(new CustomEvent('smriti_mood_updated', { detail: { mood, patientId: patient.id } }));
  }

  getNotes(patientId = null) {
    const patient = this.getPatient(patientId);
    return patient.notesList || [];
  }

  addNote(text, tags = [], patientId = null) {
    const patient = this.getPatient(patientId);
    const notes = patient.notesList || [];
    const newNote = {
      id: Date.now(),
      time: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      text,
      tags
    };
    notes.unshift(newNote);
    patient.notesList = notes;
    this.updatePatientProfile(patient, patient.id);
    window.dispatchEvent(new CustomEvent('smriti_notes_updated', { detail: { note: newNote, patientId: patient.id } }));
    return newNote;
  }

  /* ---------------------------------------------------------
     Portals & Navigation Roles
     --------------------------------------------------------- */
  getUserRole() {
    return localStorage.getItem(STORAGE_KEYS.USER_ROLE) || 'patient';
  }

  setUserRole(role) {
    localStorage.setItem(STORAGE_KEYS.USER_ROLE, role);
    window.dispatchEvent(new CustomEvent('smriti_role_changed', { detail: { role } }));
  }

  getCurrentPortal() {
    return localStorage.getItem(STORAGE_KEYS.CURRENT_PORTAL) || 'gateway';
  }

  setCurrentPortal(portal) {
    localStorage.setItem(STORAGE_KEYS.CURRENT_PORTAL, portal);
    this.setUserRole(portal === 'caregiver' ? 'caregiver' : 'patient');
    window.dispatchEvent(new CustomEvent('smriti_portal_changed', { detail: { portal } }));
  }

  // Caretaker PIN compatibility
  getCaregiverPin() {
    return "1234";
  }

  verifyCaregiverPin(entered) {
    return String(entered).trim() === "1234" || String(entered).trim() === "12345";
  }

  getCaregiverProfile() {
    const cg = this.getCurrentCaregiver();
    return {
      name: cg.name,
      relation: cg.role || "Primary Caregiver",
      phone: cg.phone || "+1 (555) 382-9011",
      email: cg.email || "sarah.vance@carefamily.org",
      pin: "1234",
      notes: "Caretaker session active."
    };
  }

  /* ---------------------------------------------------------
     Community Contributions
     --------------------------------------------------------- */
  getCommunityContributions() {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.COMMUNITY_CONTRIBUTIONS);
      return saved ? JSON.parse(saved) : DEFAULT_COMMUNITY_CONTRIBUTIONS;
    } catch(e) {
      return DEFAULT_COMMUNITY_CONTRIBUTIONS;
    }
  }

  addCommunityContribution(contribution) {
    const list = this.getCommunityContributions();
    const newEntry = {
      id: Date.now(),
      type: contribution.type || 'tip',
      title: contribution.title || 'Community Insight',
      category: contribution.category || 'General Care',
      author: contribution.author || this.getCurrentCaregiver().name,
      authorRole: contribution.authorRole || 'Caregiver',
      date: 'Just now',
      upvotes: 1,
      content: contribution.content || ''
    };
    list.unshift(newEntry);
    localStorage.setItem(STORAGE_KEYS.COMMUNITY_CONTRIBUTIONS, JSON.stringify(list));
    this.persistToServer();
    window.dispatchEvent(new CustomEvent('smriti_community_updated', { detail: { contribution: newEntry } }));
    return newEntry;
  }

  upvoteCommunityContribution(id) {
    const list = this.getCommunityContributions();
    const item = list.find(c => c.id === id);
    if (item) {
      item.upvotes = (item.upvotes || 0) + 1;
      localStorage.setItem(STORAGE_KEYS.COMMUNITY_CONTRIBUTIONS, JSON.stringify(list));
      this.persistToServer();
      window.dispatchEvent(new CustomEvent('smriti_community_updated', { detail: { list } }));
    }
    return item;
  }

  exportCSVReport(patientId = null) {
    const patient = this.getPatient(patientId);
    const records = this.getRecords(patient.id);
    let csv = `Date,Weekday,AverageScore,MemoryScore,SequencingScore,RecognitionScore,GardenScore,Mood,GamesCompleted,Patient\n`;
    records.forEach(r => {
      csv += `"${r.displayDate}","${r.weekday}",${r.averageScore || 0},${r.memoryScore != null ? r.memoryScore : ""},${r.sequencingScore != null ? r.sequencingScore : ""},${r.recognitionScore != null ? r.recognitionScore : ""},${r.gardenScore != null ? r.gardenScore : ""},"${r.mood || ''}",${r.gamesCompleted || 0},"${patient.name}"\n`;
    });

    const dataStr = "data:text/csv;charset=utf-8," + encodeURIComponent(csv);
    const dlAnchor = document.createElement('a');
    dlAnchor.setAttribute("href", dataStr);
    dlAnchor.setAttribute("download", `smriti_${patient.preferredName}_cognitive_records_${getLocalDateStr()}.csv`);
    document.body.appendChild(dlAnchor);
    dlAnchor.click();
    dlAnchor.remove();
  }

  /* ---------------------------------------------------------
     Family Photos — Stored per-patient as base64 data URLs
     --------------------------------------------------------- */
  getFamilyPhotos(patientId = null) {
    const patient = this.getPatient(patientId);
    return patient.familyPhotos || [];
  }

  addFamilyPhoto(photoData, patientId = null) {
    const patients = this.getPatients();
    const targetId = patientId || this.getActivePatientId();
    const idx = patients.findIndex(p => p.id === targetId);
    if (idx < 0) return null;

    if (!patients[idx].familyPhotos) patients[idx].familyPhotos = [];
    const entry = {
      id: 'photo_' + Date.now(),
      dataUrl: photoData.dataUrl,
      caption: photoData.caption || '',
      uploadedBy: photoData.uploadedBy || 'Caretaker',
      uploadedAt: new Date().toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })
    };
    patients[idx].familyPhotos.push(entry);
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    this.persistToServer();
    window.dispatchEvent(new CustomEvent('smriti_photos_updated', { detail: { patientId: targetId, photos: patients[idx].familyPhotos } }));
    return entry;
  }

  removeFamilyPhoto(photoId, patientId = null) {
    const patients = this.getPatients();
    const targetId = patientId || this.getActivePatientId();
    const idx = patients.findIndex(p => p.id === targetId);
    if (idx < 0) return;

    patients[idx].familyPhotos = (patients[idx].familyPhotos || []).filter(p => p.id !== photoId);
    localStorage.setItem(STORAGE_KEYS.PATIENTS, JSON.stringify(patients));
    this.persistToServer();
    window.dispatchEvent(new CustomEvent('smriti_photos_updated', { detail: { patientId: targetId, photos: patients[idx].familyPhotos } }));
  }
}

window.smritiData = new DataStore();
