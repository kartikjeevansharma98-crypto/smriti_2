/* =========================================================
   Smriti - Core Application Controller
   Coordinates Patient Experience, Caregiver Analytics,
   Game Lifecycles, and Data Synchronization.
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {
  // Application State
  const state = {
    currentPortal: 'patient', // 'patient' | 'caregiver'
    activeGame: null,
    barChart: null,
    isHighContrast: false,
    isVoiceEnabled: true
  };

  // DOM Elements
  const patientView = document.getElementById('patient-view');
  const caregiverView = document.getElementById('caregiver-view');
  const btnPortalPatient = document.getElementById('btn-portal-patient');
  const btnPortalCaregiver = document.getElementById('btn-portal-caregiver');
  const gameModal = document.getElementById('game-modal');
  const gameModalClose = document.getElementById('game-modal-close');
  const gameModalTitle = document.getElementById('game-modal-title');
  const gameContainer = document.getElementById('game-container');
  const toggleVoiceBtn = document.getElementById('toggle-voice-btn');
  const toggleContrastBtn = document.getElementById('toggle-contrast-btn');
  const btnOpenProfile = document.getElementById('btn-open-profile');
  const btnEditProfileCg = document.getElementById('btn-edit-profile-cg');
  const profileModal = document.getElementById('profile-modal');
  const profileModalClose = document.getElementById('profile-modal-close');
  const btnCancelProfile = document.getElementById('btn-cancel-profile');
  const profileForm = document.getElementById('profile-form');

  // Caregiver Elements
  const chartCanvas = document.getElementById('score-bar-chart');
  const chartFilterBtns = document.querySelectorAll('.filter-btn');
  const scoreTableBody = document.getElementById('score-table-body');
  const notesList = document.getElementById('caregiver-notes-list');
  const noteForm = document.getElementById('caregiver-note-form');
  const noteInput = document.getElementById('caregiver-note-text');

  // Initialize App
  init();

  function init() {
    setupDateTimeGreeting();
    setupLanguagePreference();
    setupPortalSwitching();
    setupMoodSelection();
    setupGameLaunchers();
    setupCaregiverDashboard();
    setupProfileManagement();
    setupChatbotAssistant();
    setupNewUserWizard();
    setupCommunityHub();
    setupAccessibilityControls();
    setupFamilyPhotos();
    listenForDataUpdates();

    // Initial greeting voice cue
    setTimeout(() => {
      const patient = window.smritiData.getPatient();
      const isHindi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
      const hour = new Date().getHours();
      let timeGreeting;
      if (isHindi) {
        timeGreeting = hour < 12 ? 'शुभ प्रभात' : hour < 17 ? 'शुभ दोपहर' : 'शुभ संध्या';
        window.smritiSpeech.speak(`${timeGreeting}, ${patient.preferredName}! आपकी दैनिक गतिविधियों में आपका स्वागत है।`);
      } else {
        timeGreeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening';
        window.smritiSpeech.speak(`${timeGreeting}, ${patient.preferredName}! Welcome to your daily activities.`);
      }
    }, 600);
  }

  /* ---------------------------------------------------------
     Family Photos — Upload (Caretaker) & Gallery (Patient)
     --------------------------------------------------------- */
  function setupFamilyPhotos() {
    const fileInput = document.getElementById('cg-photo-file-input');
    const dropzone = document.getElementById('cg-photos-dropzone');
    const browseBtn = document.getElementById('btn-browse-photos');
    const captionInput = document.getElementById('cg-photo-caption-input');
    const uploadedGrid = document.getElementById('cg-uploaded-photos-grid');
    const emptyState = document.getElementById('cg-photos-empty-state');
    const countBadge = document.getElementById('cg-photos-count-badge');
    const patientLabel = document.getElementById('cg-photos-patient-label');

    // Patient view elements
    const patientGrid = document.getElementById('family-photos-grid');
    const patientEmpty = document.getElementById('family-photos-empty');

    // --- CARETAKER UPLOAD PANEL ---

    if (browseBtn && fileInput) {
      browseBtn.addEventListener('click', () => fileInput.click());
    }

    if (dropzone && fileInput) {
      dropzone.addEventListener('click', (e) => {
        if (e.target !== browseBtn) fileInput.click();
      });

      dropzone.addEventListener('dragover', (e) => {
        e.preventDefault();
        dropzone.classList.add('drag-over');
      });
      dropzone.addEventListener('dragleave', () => dropzone.classList.remove('drag-over'));
      dropzone.addEventListener('drop', (e) => {
        e.preventDefault();
        dropzone.classList.remove('drag-over');
        handleFiles(e.dataTransfer.files);
      });
    }

    if (fileInput) {
      fileInput.addEventListener('change', () => handleFiles(fileInput.files));
    }

    function handleFiles(files) {
      const caption = captionInput ? captionInput.value.trim() : '';
      const caretaker = window.smritiData.getCurrentCaregiver();
      const caretakerName = caretaker ? caretaker.name : 'Caretaker';
      const patientId = window.smritiData.getActivePatientId();

      Array.from(files).forEach(file => {
        if (!file.type.startsWith('image/')) return;
        const reader = new FileReader();
        reader.onload = (e) => {
          window.smritiData.addFamilyPhoto({
            dataUrl: e.target.result,
            caption: caption,
            uploadedBy: caretakerName
          }, patientId);
          if (captionInput) captionInput.value = '';
          if (fileInput) fileInput.value = '';
          renderCgPhotos();
          renderPatientPhotos();
          showToast(`📸 Photo uploaded successfully!`);
        };
        reader.readAsDataURL(file);
      });
    }

    function renderCgPhotos() {
      const patient = window.smritiData.getActivePatient();
      const photos = window.smritiData.getFamilyPhotos();

      if (patientLabel) patientLabel.textContent = `For ${patient ? patient.preferredName : 'patient'}`;
      if (countBadge) countBadge.textContent = `${photos.length} photo${photos.length !== 1 ? 's' : ''}`;

      if (!uploadedGrid) return;
      if (photos.length === 0) {
        uploadedGrid.innerHTML = '';
        if (emptyState) emptyState.style.display = 'block';
        return;
      }
      if (emptyState) emptyState.style.display = 'none';

      uploadedGrid.innerHTML = photos.map(photo => `
        <div class="cg-uploaded-photo-thumb" title="${photo.caption || 'Family photo'}">
          <img src="${photo.dataUrl}" alt="${photo.caption || 'Family photo'}" loading="lazy">
          ${photo.caption ? `<div class="cg-photo-caption-label">${photo.caption}</div>` : ''}
          <button class="cg-photo-delete-btn" data-photoid="${photo.id}" title="Remove photo">✕</button>
        </div>
      `).join('');

      uploadedGrid.querySelectorAll('.cg-photo-delete-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
          e.stopPropagation();
          const photoId = btn.dataset.photoid;
          window.smritiData.removeFamilyPhoto(photoId);
          renderCgPhotos();
          renderPatientPhotos();
          showToast('Photo removed.');
        });
      });
    }

    // --- PATIENT VIEW GALLERY ---

    function renderPatientPhotos() {
      const photos = window.smritiData.getFamilyPhotos();
      if (!patientGrid) return;

      if (photos.length === 0) {
        patientGrid.innerHTML = '';
        if (patientEmpty) patientEmpty.style.display = 'block';
        return;
      }
      if (patientEmpty) patientEmpty.style.display = 'none';

      patientGrid.innerHTML = photos.map(photo => `
        <div class="family-photo-card" data-photoid="${photo.id}" data-url="${photo.dataUrl}" data-caption="${photo.caption || ''}">
          <img src="${photo.dataUrl}" alt="${photo.caption || 'Family photo'}" loading="lazy">
          <div class="family-photo-caption">${photo.caption || '❤️ Family'}</div>
          <div class="family-photo-date">📅 ${photo.uploadedAt}</div>
        </div>
      `).join('');

      patientGrid.querySelectorAll('.family-photo-card').forEach(card => {
        card.addEventListener('click', () => openLightbox(card.dataset.url, card.dataset.caption));
      });
    }

    // Lightbox for patient
    function openLightbox(url, caption) {
      const existing = document.getElementById('photo-lightbox-overlay');
      if (existing) existing.remove();

      const lb = document.createElement('div');
      lb.id = 'photo-lightbox-overlay';
      lb.className = 'photo-lightbox';
      lb.innerHTML = `
        <div class="photo-lightbox-close" id="lb-close">✕</div>
        <img src="${url}" alt="${caption || 'Family photo'}">
        ${caption ? `<div class="photo-lightbox-caption">💖 ${caption}</div>` : ''}
      `;
      document.body.appendChild(lb);

      lb.addEventListener('click', () => lb.remove());
      document.getElementById('lb-close').addEventListener('click', () => lb.remove());

      // Simran voice reads the caption
      if (caption && window.smritiSpeech) {
        const isHi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
        const msg = isHi ? `यह है आपकी पारिवारिक फोटो। ${caption}` : `Family photo: ${caption}`;
        window.smritiSpeech.speak(msg);
      }
    }

    // Sync when patient switches
    window.addEventListener('smriti_photos_updated', () => {
      renderCgPhotos();
      renderPatientPhotos();
    });

    // Initial render
    renderCgPhotos();
    renderPatientPhotos();
  }

  /* ---------------------------------------------------------
     Date, Time, and Warm Personalized Greeting
     --------------------------------------------------------- */
  function setupDateTimeGreeting() {
    const today = new Date();
    const isHindi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';

    const dayNamesEn = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const monthsEn = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

    const dayNamesHi = ['रविवार', 'सोमवार', 'मंगलवार', 'बुधवार', 'गुरुवार', 'शुक्रवार', 'शनिवार'];
    const monthsHi = ['जनवरी', 'फ़रवरी', 'मार्च', 'अप्रैल', 'मई', 'जून', 'जुलाई', 'अगस्त', 'सितंबर', 'अक्टूबर', 'नवंबर', 'दिसंबर'];

    const greetingName = document.getElementById('patient-name-span');
    const dayDisplay = document.getElementById('patient-day-name');
    const dateDisplay = document.getElementById('patient-full-date');

    const patient = window.smritiData.getPatient();
    if (greetingName) greetingName.textContent = patient.preferredName;
    if (dayDisplay) dayDisplay.textContent = isHindi ? dayNamesHi[today.getDay()] : dayNamesEn[today.getDay()];
    if (dateDisplay) {
      if (isHindi) {
        dateDisplay.textContent = `${today.getDate()} ${monthsHi[today.getMonth()]} ${today.getFullYear()}`;
      } else {
        dateDisplay.textContent = `${monthsEn[today.getMonth()]} ${today.getDate()}, ${today.getFullYear()}`;
      }
    }
  }

  /* ---------------------------------------------------------
     Starting Dual-Window Gateway & Caretaker Authentication
     --------------------------------------------------------- */
  function setupPortalSwitching() {
    const gatewayScreen = document.getElementById('portal-gateway-screen');
    const gatewayPatientSelect = document.getElementById('gateway-patient-select');
    const btnEnterPatient = document.getElementById('btn-enter-patient-window');
    
    const caretakerLoginForm = document.getElementById('form-caretaker-login');
    const caretakerLoginName = document.getElementById('caretaker-login-name');
    const caretakerLoginPass = document.getElementById('caretaker-login-password');
    const caretakerLoginErr = document.getElementById('caretaker-login-error');
    const btnAutofillCaretaker = document.getElementById('btn-autofill-caretaker');
    
    const btnGatewayLangEn = document.getElementById('gateway-lang-en');
    const btnGatewayLangHi = document.getElementById('gateway-lang-hi');

    // Populate Gateway Patient Dropdown
    function populateGatewayPatients() {
      if (!gatewayPatientSelect) return;
      const patients = window.smritiData.getPatients();
      const activeId = window.smritiData.getActivePatientId();
      gatewayPatientSelect.innerHTML = patients.map(p => {
        const selected = p.id === activeId ? 'selected' : '';
        const stageShort = (p.stage || '').split('(')[0].trim();
        return `<option value="${p.id}" ${selected}>${p.preferredName} (${p.name}, ${p.age}y - ${stageShort})</option>`;
      }).join('');
    }

    populateGatewayPatients();

    // Check saved role or show gateway at starting
    const savedRole = window.smritiData.getUserRole();
    if (!savedRole && gatewayScreen) {
      gatewayScreen.classList.add('active');
    }

    // Gateway Language Switcher
    if (btnGatewayLangEn) {
      btnGatewayLangEn.addEventListener('click', () => {
        if (window.smritiI18n) window.smritiI18n.setLanguage('en');
        btnGatewayLangEn.classList.add('active');
        btnGatewayLangHi?.classList.remove('active');
        btnGatewayLangEn.style.background = '#3b82f6';
        btnGatewayLangEn.style.color = '#ffffff';
        if (btnGatewayLangHi) {
          btnGatewayLangHi.style.background = 'transparent';
          btnGatewayLangHi.style.color = '#e2e8f0';
        }
      });
    }

    if (btnGatewayLangHi) {
      btnGatewayLangHi.addEventListener('click', () => {
        if (window.smritiI18n) window.smritiI18n.setLanguage('hi');
        btnGatewayLangHi.classList.add('active');
        btnGatewayLangEn?.classList.remove('active');
        btnGatewayLangHi.style.background = '#3b82f6';
        btnGatewayLangHi.style.color = '#ffffff';
        if (btnGatewayLangEn) {
          btnGatewayLangEn.style.background = 'transparent';
          btnGatewayLangEn.style.color = '#e2e8f0';
        }
      });
    }

    // PROFILE 1: Open Patient Companion Profile
    if (btnEnterPatient) {
      btnEnterPatient.addEventListener('click', () => {
        const selectedPatientId = gatewayPatientSelect ? gatewayPatientSelect.value : null;
        if (selectedPatientId) {
          window.smritiData.setActivePatient(selectedPatientId);
        }
        window.smritiData.setUserRole('patient');
        if (gatewayScreen) gatewayScreen.classList.remove('active');
        switchPortal('patient');
        setupDateTimeGreeting();

        const activePatient = window.smritiData.getActivePatient();
        const isHi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
        const msg = isHi 
          ? `नमस्ते ${activePatient.preferredName}! आपकी प्रोफाइल में आपका स्वागत है।` 
          : `Welcome ${activePatient.preferredName}! Your patient companion profile is open.`;
        window.smritiSpeech.speak(msg);
        showToast(msg);
      });
    }

    // Autofill Sarah Vance helper
    if (btnAutofillCaretaker) {
      btnAutofillCaretaker.addEventListener('click', () => {
        if (caretakerLoginName) caretakerLoginName.value = 'Sarah Vance';
        if (caretakerLoginPass) caretakerLoginPass.value = 'password123';
        if (caretakerLoginErr) caretakerLoginErr.style.display = 'none';
        showToast('Filled credentials for Sarah Vance');
      });
    }

    // PROFILE 2: Caretaker Login Form Submission
    if (caretakerLoginForm) {
      caretakerLoginForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const nameOrEmail = (caretakerLoginName?.value || '').trim();
        const password = (caretakerLoginPass?.value || '').trim();

        const res = window.smritiData.loginCaregiver(nameOrEmail, password);
        if (res.success) {
          if (caretakerLoginErr) caretakerLoginErr.style.display = 'none';
          if (gatewayScreen) gatewayScreen.classList.remove('active');
          switchPortal('caregiver');
          renderPatientRoster();
          if (window.smritiAudio) window.smritiAudio.playSuccess();
          showToast(`Welcome, Caretaker ${res.caregiver.name}! Multi-patient command center active.`);
        } else {
          if (caretakerLoginErr) {
            caretakerLoginErr.textContent = `⚠️ ${res.error}`;
            caretakerLoginErr.style.display = 'block';
          }
          if (window.smritiAudio) window.smritiAudio.playPop();
        }
      });
    }

    // Navigation buttons in top header
    btnPortalPatient.addEventListener('click', () => {
      switchPortal('patient');
    });

    btnPortalCaregiver.addEventListener('click', () => {
      const currentRole = window.smritiData.getUserRole();
      if (currentRole !== 'caregiver') {
        if (gatewayScreen) {
          gatewayScreen.classList.add('active');
          if (caretakerLoginPass) caretakerLoginPass.focus();
        }
      } else {
        switchPortal('caregiver');
      }
    });

    // Logout / Switch User Handlers (Returns to Starting Dual Window Gateway)
    const btnLogout = document.getElementById('btn-logout');
    const btnLogoutCg = document.getElementById('btn-logout-cg');
    const btnHubLogout = document.getElementById('btn-hub-logout');

    const handleLogoutToGateway = () => {
      window.smritiData.setUserRole(null);
      populateGatewayPatients();
      if (caretakerLoginErr) caretakerLoginErr.style.display = 'none';
      if (gatewayScreen) gatewayScreen.classList.add('active');
      showToast('Returned to Starting Window selection.');
    };

    if (btnLogout) btnLogout.addEventListener('click', handleLogoutToGateway);
    if (btnLogoutCg) btnLogoutCg.addEventListener('click', handleLogoutToGateway);
    if (btnHubLogout) btnHubLogout.addEventListener('click', handleLogoutToGateway);
  }

  function switchPortal(portal) {
    if (window.smritiSpeech) window.smritiSpeech.stopAllAudio();
    state.currentPortal = portal;
    if (portal === 'caregiver') {
      document.body.classList.add('caregiver-mode');
      btnPortalCaregiver.classList.add('active');
      btnPortalPatient.classList.remove('active');
      patientView.classList.add('hidden');
      caregiverView.classList.remove('hidden');

      // Refresh caregiver views & bar graph
      refreshCaregiverDashboard();
      showToast('Unlocked Caregiver Portal');
    } else {
      document.body.classList.remove('caregiver-mode');
      btnPortalPatient.classList.add('active');
      btnPortalCaregiver.classList.remove('active');
      caregiverView.classList.add('hidden');
      patientView.classList.remove('hidden');
      refreshPatientStatus();
    }
  }

  /* ---------------------------------------------------------
     Mood Selection & Check-in
     --------------------------------------------------------- */
  function setupMoodSelection() {
    const moodBtns = document.querySelectorAll('.mood-btn');
    const currentMood = window.smritiData.getCurrentMood();

    moodBtns.forEach(btn => {
      if (btn.getAttribute('data-mood') === currentMood) {
        btn.classList.add('selected');
      }

      btn.addEventListener('click', () => {
        moodBtns.forEach(b => b.classList.remove('selected'));
        btn.classList.add('selected');

        const selectedMood = btn.getAttribute('data-mood');
        const moodLabel = btn.querySelector('.mood-label').textContent;
        window.smritiData.setMood(selectedMood);

        const isHindi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
        const speechMsg = isHindi 
          ? `साझा करने के लिए धन्यवाद। हमें पता चला कि आप आज ${moodLabel} महसूस कर रहे हैं।`
          : `Thank you for sharing. We noted that you feel ${moodLabel} today.`;
        window.smritiSpeech.speak(speechMsg);

        const toastMsg = isHindi
          ? `आज का मूड दर्ज किया गया: ${moodLabel}`
          : `Today's feeling recorded: ${moodLabel}`;
        showToast(toastMsg);
      });
    });

    const moodReadBtn = document.getElementById('mood-read-btn');
    if (moodReadBtn) {
      moodReadBtn.addEventListener('click', () => {
        const isHindi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
        const prompt = isHindi
          ? "आज आप कैसा महसूस कर रहे हैं? खुश, शांत, सामान्य या थका हुआ में से चुनें।"
          : "How are you feeling today? Tap happy, calm, okay, or tired to let your caregiver know.";
        window.smritiSpeech.speak(prompt);
      });
    }
  }

  /* ---------------------------------------------------------
     Game Launchers & Modal Handling
     --------------------------------------------------------- */
  function setupGameLaunchers() {
    const gameCards = document.querySelectorAll('.game-card');
    gameCards.forEach(card => {
      card.addEventListener('click', () => {
        const gameType = card.getAttribute('data-game');
        launchGame(gameType);
      });
    });

    gameModalClose.addEventListener('click', closeGameModal);

    // Close on ESC
    document.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && gameModal.classList.contains('active')) {
        closeGameModal();
      }
    });
  }

  function launchGame(gameType) {
    if (window.smritiSpeech) window.smritiSpeech.stopAllAudio();
    gameModal.classList.add('active');
    gameContainer.innerHTML = '';

    const handleComplete = (score) => {
      refreshPatientStatus();
      refreshCaregiverDashboard();
      showToast(`Game completed! Score: ${score}% logged.`);
    };

    switch (gameType) {
      case 'memory':
        gameModalTitle.innerHTML = '<span>👓 Daily Essentials Match</span>';
        state.activeGame = new window.MemoryGame('game-container', () => closeGameModal());
        break;
      case 'sequencing':
        gameModalTitle.innerHTML = '<span>📋 Daily Routine Sequencing</span>';
        state.activeGame = new window.SequencingGame('game-container', () => closeGameModal());
        break;
      case 'recognition':
        gameModalTitle.innerHTML = '<span>💡 Everyday Object Recognition</span>';
        state.activeGame = new window.RecognitionGame('game-container', () => closeGameModal());
        break;
      case 'garden':
        gameModalTitle.innerHTML = '<span>🌸 Calming Focus Garden</span>';
        state.activeGame = new window.FocusGardenGame('game-container', () => closeGameModal());
        break;
    }

    if (state.activeGame) {
      state.activeGame.start();
    }
  }

  function closeGameModal() {
    if (window.smritiSpeech) window.smritiSpeech.stopAllAudio();
    gameModal.classList.remove('active');
    gameContainer.innerHTML = '';
    state.activeGame = null;
    refreshPatientStatus();
    refreshCaregiverDashboard();
  }

  function refreshPatientStatus() {
    const today = window.smritiData.getTodayRecord();
    const isHi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
    const pills = {
      memory: document.getElementById('pill-game-memory'),
      sequencing: document.getElementById('pill-game-sequencing'),
      recognition: document.getElementById('pill-game-recognition'),
      garden: document.getElementById('pill-game-garden')
    };

    const updatePill = (pill, score) => {
      if (!pill) return;
      if (score !== null && score !== undefined) {
        pill.textContent = isHi ? `पूर्ण (${score}%)` : `Completed (${score}%)`;
        pill.classList.add('done');
      } else {
        pill.textContent = isHi ? 'शुरू करें' : 'Ready to Play';
        pill.classList.remove('done');
      }
    };

    updatePill(pills.memory, today.memoryScore);
    updatePill(pills.sequencing, today.sequencingScore);
    updatePill(pills.recognition, today.recognitionScore);
    updatePill(pills.garden, today.gardenScore);
  }

  /* ---------------------------------------------------------
     Caregiver Dashboard & Interactive Bar Chart
     --------------------------------------------------------- */
  function setupCaregiverDashboard() {
    // Instantiate Chart
    if (chartCanvas) {
      state.barChart = new window.CognitiveBarChart('score-bar-chart');
    }

    // Chart Filter Buttons
    chartFilterBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        chartFilterBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');
        const filter = btn.getAttribute('data-filter');
        if (state.barChart) {
          state.barChart.setFilter(filter);
        }
      });
    });

    // Multi-Patient Roster Rendering
    renderPatientRoster();

    // Patient select dropdown in status banner
    const patientSelectDropdown = document.getElementById('cg-patient-select-dropdown');
    if (patientSelectDropdown) {
      patientSelectDropdown.addEventListener('change', (e) => {
        const newPatientId = e.target.value;
        if (newPatientId) {
          window.smritiData.setActivePatient(newPatientId);
          refreshCaregiverDashboard();
          renderPatientRoster();
          setupDateTimeGreeting();
          const p = window.smritiData.getActivePatient();
          showToast(`Now inspecting: ${p.name}`);
        }
      });
    }

    // Add New Patient Button from Roster
    const btnAddNewPatient = document.getElementById('btn-add-new-patient-roster');
    const newUserModal = document.getElementById('new-user-modal');
    if (btnAddNewPatient && newUserModal) {
      btnAddNewPatient.addEventListener('click', () => {
        newUserModal.classList.add('active');
      });
    }


    // Caregiver Note Form
    if (noteForm) {
      noteForm.addEventListener('submit', (e) => {
        e.preventDefault();
        const text = noteInput.value.trim();
        if (!text) return;

        const checkMeds = document.getElementById('check-meds')?.checked;
        const checkHydration = document.getElementById('check-hydrated')?.checked;
        const tags = [];
        if (checkMeds) tags.push('Medication Taken');
        if (checkHydration) tags.push('Hydrated');

        window.smritiData.addNote(text, tags);
        noteInput.value = '';
        if (document.getElementById('check-meds')) document.getElementById('check-meds').checked = false;
        if (document.getElementById('check-hydrated')) document.getElementById('check-hydrated').checked = false;

        renderNotes();
        showToast('Caregiver observation saved');
      });
    }

    // Caregiver Emergency Dial and Quick Action triggers
    const btnCallDoctor = document.getElementById('cg-call-doctor');
    const btnCallCaregiver = document.getElementById('cg-call-caregiver');
    const btnExportReport = document.getElementById('cg-export-report');

    if (btnCallDoctor) {
      btnCallDoctor.addEventListener('click', () => {
        const patient = window.smritiData.getPatient();
        alert(`Contacting ${patient.doctorName || 'Doctor'}\nClinic Phone: ${patient.doctorPhone || '+1 (555) 902-8811'}`);
      });
    }
    if (btnCallCaregiver) {
      btnCallCaregiver.addEventListener('click', () => {
        const patient = window.smritiData.getPatient();
        alert(`Calling Primary Caretaker:\n${patient.caregiverName} (${patient.caregiverRelation || 'Primary Caretaker'})\nPhone: ${patient.emergencyPhone}`);
      });
    }
    if (btnExportReport) {
      btnExportReport.addEventListener('click', () => {
        window.print();
      });
    }

    // Disk Data Backup & Restore
    const btnBackupJson = document.getElementById('cg-backup-json');
    const btnRestoreJson = document.getElementById('cg-restore-json');
    const fileInput = document.getElementById('cg-file-input');

    if (btnBackupJson) {
      btnBackupJson.addEventListener('click', () => {
        window.smritiData.exportJSONBackup();
        showToast('Database exported & backed up to disk!');
      });
    }

    if (btnRestoreJson && fileInput) {
      btnRestoreJson.addEventListener('click', () => fileInput.click());
      fileInput.addEventListener('change', (e) => {
        const file = e.target.files[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (event) => {
          const res = window.smritiData.importJSONBackup(event.target.result);
          if (res.success) {
            showToast('Backup restored successfully!');
            refreshCaregiverDashboard();
            setupDateTimeGreeting();
          } else {
            showToast('Failed to import backup: ' + res.error);
          }
        };
        reader.readAsText(file);
      });
    }

    // Theatre Mode Toggle for Large Screen Immersion
    const btnToggleTheatre = document.getElementById('btn-toggle-theatre');
    const gameModalContent = document.getElementById('game-modal-content');
    if (btnToggleTheatre && gameModalContent) {
      btnToggleTheatre.addEventListener('click', () => {
        gameModalContent.classList.toggle('theatre-mode');
        const isTheatre = gameModalContent.classList.contains('theatre-mode');
        btnToggleTheatre.textContent = isTheatre ? 'Standard Size' : '⛶ Theatre Mode';
      });
    }
  }

  /* ---------------------------------------------------------
     AI Care Companion Chatbot
     --------------------------------------------------------- */
  function setupChatbotAssistant() {
    const chatbotModal = document.getElementById('chatbot-modal');
    const chatbotClose = document.getElementById('chatbot-modal-close');
    const btnHeaderChatbot = document.getElementById('btn-header-chatbot');
    const floatingAiBtn = document.getElementById('floating-ai-btn');
    const msgList = document.getElementById('chatbot-msg-list');
    const form = document.getElementById('chatbot-input-form');
    const textInput = document.getElementById('chatbot-text-input');
    const chipsBar = document.getElementById('chatbot-chips-bar');

    const bot = new window.SmritiChatbot();

    function syncChatbotUI() {
      const isHi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
      const patient = window.smritiData.getPatient();
      const cgName = patient.caregiverName || (isHi ? 'देखभालकर्ता' : 'Caretaker');

      if (textInput) {
        textInput.placeholder = isHi 
          ? "कुछ भी पूछें, जैसे 'मैं कहाँ हूँ?', 'समय क्या हुआ है?', 'सारा को कॉल करो'..."
          : "Ask anything, e.g. 'Call Sarah', 'What time is it?', 'Where is my home?'...";
      }

      if (chipsBar) {
        const chips = chipsBar.querySelectorAll('[data-chip]');
        chips.forEach(chip => {
          const type = chip.getAttribute('data-chip');
          if (type === 'call_caregiver') chip.textContent = isHi ? `📞 कॉल करें: ${cgName}` : `📞 Call ${cgName}`;
          if (type === 'call_doctor') chip.textContent = isHi ? '🩺 डॉक्टर को कॉल करें' : '🩺 Call Doctor';
          if (type === 'location') chip.textContent = isHi ? '📍 मैं कहाँ हूँ?' : '📍 Where am I?';
          if (type === 'date') chip.textContent = isHi ? '⏰ आज कौन सा दिन है?' : '⏰ What day is today?';
          if (type === 'go_garden') chip.textContent = isHi ? '🌸 फूलों का बगीचा' : '🌸 Visit Garden';
          if (type === 'comfort') chip.textContent = isHi ? '💖 मुझे थोड़ी चिंता हो रही है' : '💖 I feel worried';
        });
      }
    }

    const openChat = () => {
      if (window.smritiSpeech) window.smritiSpeech.stopAllAudio();
      syncChatbotUI();
      renderMessages();
      chatbotModal.classList.add('active');
      setTimeout(() => textInput?.focus(), 150);
    };

    const closeChat = () => {
      if (window.smritiSpeech) window.smritiSpeech.stopAllAudio();
      chatbotModal.classList.remove('active');
    };

    if (btnHeaderChatbot) btnHeaderChatbot.addEventListener('click', openChat);
    if (floatingAiBtn) floatingAiBtn.addEventListener('click', openChat);
    if (chatbotClose) chatbotClose.addEventListener('click', closeChat);

    window.addEventListener('smriti_language_changed', () => {
      bot.seedWelcome();
      syncChatbotUI();
      renderMessages();
    });

    function renderMessages() {
      if (!msgList) return;
      msgList.innerHTML = bot.messages.map((m) => {
        return `
          <div class="support-msg ${m.sender}">
            <p>${m.text}</p>
            ${m.actions && m.actions.length > 0 ? `
              <div style="display:flex; flex-wrap:wrap; gap:8px; margin-top:10px;">
                ${m.actions.map(act => `
                  <button class="read-btn bot-action-btn ${act.isPrimary ? 'done' : ''}" data-act="${act.type}" style="font-size:0.88rem; padding:6px 12px;">
                    ${act.label}
                  </button>
                `).join('')}
              </div>
            ` : ''}
          </div>
        `;
      }).join('');

      msgList.scrollTop = msgList.scrollHeight;

      // Attach action clicks
      msgList.querySelectorAll('.bot-action-btn').forEach(btn => {
        btn.addEventListener('click', () => {
          const actionType = btn.getAttribute('data-act');
          bot.handleAction(actionType);
        });
      });
    }

    // Quick chips click handler
    if (chipsBar) {
      chipsBar.querySelectorAll('[data-chip]').forEach(chip => {
        chip.addEventListener('click', () => {
          const type = chip.getAttribute('data-chip');
          const isHi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
          if (type === 'comfort') {
            handleUserSend(isHi ? "मुझे थोड़ी चिंता हो रही है" : "I feel a little worried");
          } else {
            bot.handleAction(type);
          }
        });
      });
    }

    function handleUserSend(userText) {
      if (!userText) return;
      bot.messages.push({ sender: 'user', text: userText });
      renderMessages();

      // Bot thinking & answer
      setTimeout(() => {
        try {
          const res = bot.respond(userText) || {};
          const reply = res.reply || (window.smritiI18n && window.smritiI18n.getLanguage() === 'hi' 
            ? "नमस्ते! मैं आपकी क्या सहायता कर सकता हूँ?" 
            : "Hello! How can I assist you today?");
          const actions = res.actions || [];
          bot.messages.push({ sender: 'bot', text: reply, actions });
          renderMessages();
          window.smritiSpeech.speak(reply);
          if (window.smritiAudio) window.smritiAudio.playChime();
        } catch (err) {
          console.error("Chatbot response error:", err);
          const isHi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
          const fallbackReply = isHi 
            ? "मैं यहाँ आपकी सहायता के लिए हूँ। आप बिल्कुल सुरक्षित हैं। क्या आप अपनी देखभालकर्ता को कॉल करना चाहते हैं?"
            : "I am here to help you. You are completely safe. Would you like to call your caretaker?";
          bot.messages.push({ 
            sender: 'bot', 
            text: fallbackReply, 
            actions: [{ label: isHi ? "📞 देखभालकर्ता को कॉल करें" : "📞 Call Caretaker", type: "call_caregiver" }] 
          });
          renderMessages();
          window.smritiSpeech.speak(fallbackReply);
        }
      }, 350);
    }

    if (form && textInput) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();
        const txt = textInput.value.trim();
        if (!txt) return;
        textInput.value = '';
        handleUserSend(txt);
      });
    }
  }

  /* ---------------------------------------------------------
     Patient & Caretaker Profile Management
     --------------------------------------------------------- */
  function setupProfileManagement() {
    const openModal = () => {
      populateProfileForm();
      profileModal.classList.add('active');
    };

    const closeModal = () => {
      profileModal.classList.remove('active');
    };

    if (btnOpenProfile) btnOpenProfile.addEventListener('click', openModal);
    if (btnEditProfileCg) btnEditProfileCg.addEventListener('click', openModal);
    if (profileModalClose) profileModalClose.addEventListener('click', closeModal);
    if (btnCancelProfile) btnCancelProfile.addEventListener('click', closeModal);

    // Populate current values
    function populateProfileForm() {
      const p = window.smritiData.getPatient();
      const cg = window.smritiData.getCaregiverProfile();
      const setVal = (id, val) => {
        const el = document.getElementById(id);
        if (el) el.value = val || '';
      };

      setVal('prof-patient-name', p.name);
      setVal('prof-patient-preferred', p.preferredName);
      setVal('prof-patient-age', p.age);
      setVal('prof-patient-stage', p.stage);
      setVal('prof-patient-notes', p.notes);
      const currentLang = (window.smritiI18n && window.smritiI18n.getLanguage()) || 'en';
      setVal('prof-language', currentLang);
      setVal('prof-cg-name', cg.name || p.caregiverName);
      setVal('prof-cg-relation', cg.relation || p.caregiverRelation);
      setVal('prof-cg-phone', cg.phone || p.emergencyPhone);
      setVal('prof-cg-email', cg.email || '');
      setVal('prof-cg-pin', window.smritiData.getCaregiverPin());
      setVal('prof-home-address', p.homeAddress);
      setVal('prof-doc-name', p.doctorName);
      setVal('prof-doc-phone', p.doctorPhone);
    }

    // Save profile form submission
    if (profileForm) {
      profileForm.addEventListener('submit', (e) => {
        e.preventDefault();

        const cgEmail = document.getElementById('prof-cg-email')?.value.trim() || '';
        const cgPin = document.getElementById('prof-cg-pin')?.value.trim() || '1234';
        const langChoice = document.getElementById('prof-language')?.value || 'en';

        const updated = {
          name: document.getElementById('prof-patient-name').value.trim(),
          preferredName: document.getElementById('prof-patient-preferred').value.trim(),
          age: parseInt(document.getElementById('prof-patient-age').value, 10) || 74,
          stage: document.getElementById('prof-patient-stage').value,
          notes: document.getElementById('prof-patient-notes').value.trim(),
          caregiverName: document.getElementById('prof-cg-name').value.trim(),
          caregiverRelation: document.getElementById('prof-cg-relation').value.trim(),
          emergencyPhone: document.getElementById('prof-cg-phone').value.trim(),
          homeAddress: document.getElementById('prof-home-address').value.trim(),
          doctorName: document.getElementById('prof-doc-name').value.trim(),
          doctorPhone: document.getElementById('prof-doc-phone').value.trim()
        };

        window.smritiData.updatePatientProfile(updated);
        window.smritiData.saveCaregiverProfile({
          name: updated.caregiverName,
          relation: updated.caregiverRelation,
          phone: updated.emergencyPhone,
          email: cgEmail,
          pin: cgPin
        });
        window.smritiData.setCaregiverPin(cgPin);

        if (window.smritiI18n && window.smritiI18n.getLanguage() !== langChoice) {
          window.smritiI18n.setLanguage(langChoice);
        }

        closeModal();

        // Refresh UI
        setupDateTimeGreeting();
        refreshCaregiverDashboard();
        const isHi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
        showToast(isHi ? 'मरीज़ और देखभालकर्ता प्रोफ़ाइल सहेज ली गई!' : 'Patient & Caretaker Profile saved with custom passcode!');
        window.smritiSpeech.speak(isHi 
          ? `${updated.preferredName} और देखभालकर्ता ${updated.caregiverName} की प्रोफ़ाइल अपडेट कर दी गई है।`
          : `Profile updated for ${updated.preferredName} and caretaker ${updated.caregiverName}.`
        );
      });
    }
  }

  function renderPatientRoster() {
    const rosterGrid = document.getElementById('cg-patient-roster-grid');
    const patientSelectDropdown = document.getElementById('cg-patient-select-dropdown');
    const cgLoggedName = document.getElementById('cg-logged-in-caretaker');
    const cgLoggedRole = document.getElementById('cg-logged-in-role');
    const countBadge = document.getElementById('cg-patient-count-badge');

    const caregiver = window.smritiData.getCurrentCaregiver();
    const patients = window.smritiData.getCaregiverPatients();
    const activePatient = window.smritiData.getActivePatient();

    if (cgLoggedName && caregiver) cgLoggedName.textContent = caregiver.name;
    if (countBadge) countBadge.textContent = `${patients.length} Patients Under Care`;

    // Populate dropdown
    if (patientSelectDropdown) {
      patientSelectDropdown.innerHTML = patients.map(p => {
        const isSel = p.id === activePatient.id ? 'selected' : '';
        const stageShort = (p.stage || '').split('(')[0].trim();
        return `<option value="${p.id}" ${isSel}>${p.name} (${p.age}y - ${stageShort})</option>`;
      }).join('');
    }

    if (!rosterGrid) return;

    const cardsHtml = patients.map(p => {
      const isActive = p.id === activePatient.id;
      const today = p.scores ? p.scores[p.scores.length - 1] : { averageScore: 85, mood: 'happy', gamesCompleted: 3 };
      const avgScore = today?.averageScore || 85;
      const mood = today?.mood || 'happy';
      const gamesDone = today?.gamesCompleted != null ? today.gamesCompleted : 3;
      const avatar = p.gender === 'Male' ? '👴' : '👵';

      return `
        <div class="cg-patient-card ${isActive ? 'active' : ''}" data-patient-id="${p.id}">
          <div class="cg-card-top">
            <div class="cg-card-avatar-wrap">
              <div class="cg-card-avatar">${avatar}</div>
              <div class="cg-card-name-meta">
                <h4>${p.name}</h4>
                <span>${p.age}y • ${(p.stage || '').split('(')[0].trim()}</span>
              </div>
            </div>
            <div class="cg-card-score-pill" title="Actual Daily Score">${avgScore}%</div>
          </div>

          <div class="cg-card-stats-row">
            <span>Mood: <strong>${mood.toUpperCase()}</strong></span>
            <span>Games: <strong>${gamesDone} / 4</strong></span>
          </div>

          <div class="cg-card-bottom">
            <span class="cg-card-badge">${isActive ? '● CURRENTLY INSPECTING' : 'CLICK TO INSPECT'}</span>
            <span class="cg-card-inspect-action">${isActive ? 'Active Record ✓' : 'Inspect ➔'}</span>
          </div>
        </div>
      `;
    }).join('');

    const addCardHtml = `
      <div class="cg-add-patient-card" id="btn-add-patient-card-trigger">
        <div class="cg-add-patient-icon">➕</div>
        <strong style="font-size:1rem; color:#f8fafc;">Add New Patient</strong>
        <span style="font-size:0.8rem; color:#94a3b8; text-align:center;">Register a new family member or resident</span>
      </div>
    `;

    rosterGrid.innerHTML = cardsHtml + addCardHtml;

    // Attach click listeners to cards
    rosterGrid.querySelectorAll('.cg-patient-card').forEach(card => {
      card.addEventListener('click', () => {
        const pId = card.getAttribute('data-patient-id');
        if (pId && pId !== activePatient.id) {
          window.smritiData.setActivePatient(pId);
          refreshCaregiverDashboard();
          renderPatientRoster();
          setupDateTimeGreeting();
          const newlySelected = window.smritiData.getActivePatient();
          showToast(`Switched inspection to ${newlySelected.name}`);
        }
      });
    });

    const addCardBtn = document.getElementById('btn-add-patient-card-trigger');
    if (addCardBtn) {
      addCardBtn.addEventListener('click', () => {
        const newUserModal = document.getElementById('new-user-modal');
        if (newUserModal) newUserModal.classList.add('active');
      });
    }
  }

  function refreshCaregiverDashboard() {
    const patient = window.smritiData.getPatient();
    const metrics = window.smritiData.getSummaryMetrics();
    const today = window.smritiData.getTodayRecord();

    // Patient Profile Banner
    const avatarEl = document.getElementById('cg-patient-avatar');
    if (avatarEl) avatarEl.textContent = patient.gender === 'Male' ? '👴' : '👵';
        const nameEl = document.getElementById('cg-patient-name');
    const stageEl = document.getElementById('cg-patient-stage');
    const moodEl = document.getElementById('cg-today-mood-pill');
    const gamesCountEl = document.getElementById('cg-today-games-pill');

    if (nameEl) nameEl.textContent = `${patient.name}, ${patient.age}y`;
    if (stageEl) {
      const cgContact = patient.caregiverName ? ` • Primary Caretaker: ${patient.caregiverName} (${patient.emergencyPhone})` : '';
      stageEl.textContent = `${patient.stage}${cgContact}`;
    }
    if (moodEl) moodEl.textContent = (today.mood || 'Happy').toUpperCase();
    if (gamesCountEl) gamesCountEl.textContent = `${today.gamesCompleted || 0} / 4 Done`;

    // Dynamic emergency action button subtitles
    const docMeta = document.getElementById('cg-doc-meta');
    const docTitle = document.getElementById('cg-doc-title');
    if (docMeta) docMeta.textContent = `${patient.doctorName || 'Doctor'} (${patient.doctorPhone || 'Clinic'})`;
    if (docTitle && patient.doctorName) docTitle.textContent = `Contact Doctor: ${patient.doctorName.split(' ')[0]}`;

    const cgMeta = document.getElementById('cg-caregiver-meta');
    const cgTitle = document.getElementById('cg-caregiver-title');
    if (cgMeta) cgMeta.textContent = `${patient.caregiverName}: ${patient.emergencyPhone}`;
    if (cgTitle) cgTitle.textContent = `Call Caretaker (${patient.caregiverRelation || 'Emergency'})`;

    // Metrics Cards
    const valOverall = document.getElementById('metric-val-overall');
    const valMemory = document.getElementById('metric-val-memory');
    const valSeq = document.getElementById('metric-val-seq');
    const valRec = document.getElementById('metric-val-rec');
    const valGarden = document.getElementById('metric-val-garden');

    if (valOverall) valOverall.textContent = `${metrics.overall}%`;
    if (valMemory) valMemory.textContent = `${metrics.memory}%`;
    if (valSeq) valSeq.textContent = `${metrics.seq}%`;
    if (valRec) valRec.textContent = `${metrics.rec}%`;
    if (valGarden) valGarden.textContent = `${metrics.garden}%`;

    // Redraw Bar Chart
    if (state.barChart) {
      state.barChart.updateScores(patient.scores || window.smritiData.getRecords());
      setTimeout(() => {
        state.barChart.resizeAndDraw();
      }, 50);
    }

    // Render Table & Notes
    renderScoreTable();
    renderNotes();
  }

  function renderScoreTable() {
    if (!scoreTableBody) return;
    const records = window.smritiData.getRecords().slice(-8).reverse();

    scoreTableBody.innerHTML = records.map(rec => {
      const getTagClass = (score) => {
        if (!score && score !== 0) return 'score-tag';
        if (score >= 80) return 'score-tag high';
        if (score >= 65) return 'score-tag medium';
        return 'score-tag low';
      };

      const moodEmoji = {
        happy: '😊 Happy',
        calm: '😌 Calm',
        neutral: '😐 Neutral',
        tired: '😔 Tired'
      }[rec.mood] || '😊 Happy';

      return `
        <tr>
          <td><strong>${rec.displayDate}</strong> (${rec.weekday})</td>
          <td>
            <span class="${getTagClass(rec.averageScore)}">
              ${rec.averageScore > 0 ? rec.averageScore + '%' : 'Pending'}
            </span>
          </td>
          <td>${rec.memoryScore != null ? rec.memoryScore + '%' : '—'}</td>
          <td>${rec.sequencingScore != null ? rec.sequencingScore + '%' : '—'}</td>
          <td>${rec.recognitionScore != null ? rec.recognitionScore + '%' : '—'}</td>
          <td>${rec.gardenScore != null ? rec.gardenScore + '%' : '—'}</td>
          <td>${moodEmoji}</td>
        </tr>
      `;
    }).join('');
  }

  function renderNotes() {
    if (!notesList) return;
    const notes = window.smritiData.getNotes();

    notesList.innerHTML = notes.map(n => `
      <div class="cg-note-entry">
        <div class="cg-note-time">${n.time}</div>
        <div class="cg-note-text">${n.text}</div>
        ${n.tags && n.tags.length > 0 ? `
          <div class="cg-note-tags">
            ${n.tags.map(t => `<span class="cg-note-tag">${t}</span>`).join('')}
          </div>
        ` : ''}
      </div>
    `).join('');
  }

  /* ---------------------------------------------------------
     Accessibility Controls (Speech Voice & High Contrast)
     --------------------------------------------------------- */
  function setupAccessibilityControls() {
    toggleVoiceBtn.addEventListener('click', () => {
      state.isVoiceEnabled = window.smritiSpeech.toggleVoice();
      const isHi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
      if (state.isVoiceEnabled) {
        toggleVoiceBtn.innerHTML = isHi ? '🔊 आवाज़ चालू' : '🔊 Voice On';
        showToast(isHi ? 'ऑडियो वाचन सक्षम किया गया' : 'Audio reading enabled');
      } else {
        toggleVoiceBtn.innerHTML = isHi ? '🔇 आवाज़ बंद' : '🔇 Voice Off';
        showToast(isHi ? 'ऑडियो वाचन म्यूट किया गया' : 'Audio reading muted');
      }
    });

    toggleContrastBtn.addEventListener('click', () => {
      state.isHighContrast = !state.isHighContrast;
      document.body.classList.toggle('high-contrast', state.isHighContrast);
      const isHi = window.smritiI18n && window.smritiI18n.getLanguage() === 'hi';
      showToast(state.isHighContrast 
        ? (isHi ? 'उच्च कंट्रास्ट मोड चालू' : 'High Contrast Mode On') 
        : (isHi ? 'सामान्य कंट्रास्ट मोड चालू' : 'Standard Contrast Mode On')
      );
    });
  }

  /* ---------------------------------------------------------
     Language Preference (English & Hindi)
     --------------------------------------------------------- */
  function setupLanguagePreference() {
    const btnLangEn = document.getElementById('btn-lang-en');
    const btnLangHi = document.getElementById('btn-lang-hi');
    const welcomeLangEn = document.getElementById('welcome-lang-en');
    const welcomeLangHi = document.getElementById('welcome-lang-hi');
    const profLanguage = document.getElementById('prof-language');

    const syncButtonsAndUI = (lang) => {
      document.querySelectorAll('.lang-btn').forEach(b => {
        if (b.getAttribute('data-lang') === lang) {
          b.classList.add('active');
        } else {
          b.classList.remove('active');
        }
      });
      if (profLanguage) profLanguage.value = lang;
      setupDateTimeGreeting();
      
      // Update voice & contrast button labels
      if (toggleVoiceBtn) {
        toggleVoiceBtn.innerHTML = state.isVoiceEnabled 
          ? (lang === 'hi' ? '🔊 आवाज़ चालू' : '🔊 Voice On')
          : (lang === 'hi' ? '🔇 आवाज़ बंद' : '🔇 Voice Off');
      }
      if (toggleContrastBtn) {
        toggleContrastBtn.innerHTML = lang === 'hi' ? '👁️ उच्च कंट्रास्ट' : '👁️ High Contrast';
      }
    };

    const handleSwitchLang = (lang) => {
      if (!window.smritiI18n) return;
      window.smritiI18n.setLanguage(lang);
      syncButtonsAndUI(lang);

      if (lang === 'hi') {
        showToast('भाषा बदलकर हिंदी कर दी गई है 🇮🇳');
        window.smritiSpeech.speak('नमस्ते! स्मृति में आपका स्वागत है। आपकी दैनिक गतिविधियों में हम आपके साथ हैं।');
      } else {
        showToast('Language changed to English 🇬🇧');
        window.smritiSpeech.speak('Language changed to English. Welcome back.');
      }
    };

    if (btnLangEn) btnLangEn.addEventListener('click', () => handleSwitchLang('en'));
    if (btnLangHi) btnLangHi.addEventListener('click', () => handleSwitchLang('hi'));
    if (welcomeLangEn) welcomeLangEn.addEventListener('click', () => handleSwitchLang('en'));
    if (welcomeLangHi) welcomeLangHi.addEventListener('click', () => handleSwitchLang('hi'));

    if (profLanguage) {
      profLanguage.addEventListener('change', (e) => {
        handleSwitchLang(e.target.value);
      });
    }

    window.addEventListener('smriti_language_changed', (e) => {
      const lang = e.detail?.language || 'en';
      syncButtonsAndUI(lang);
    });

    // Initial sync
    if (window.smritiI18n) {
      syncButtonsAndUI(window.smritiI18n.getLanguage());
    }
  }

  /* ---------------------------------------------------------
     New User Onboarding & Registration Wizard
     --------------------------------------------------------- */
  function setupNewUserWizard() {
    const modal = document.getElementById('new-user-modal');
    const modalClose = document.getElementById('new-user-modal-close');
    const btnOpenFromWelcome = document.getElementById('btn-open-new-user-wizard');
    const roleWelcomeModal = document.getElementById('role-welcome-modal');

    const step1 = document.getElementById('nu-step-1');
    const step2 = document.getElementById('nu-step-2');
    const step3 = document.getElementById('nu-step-3');
    const ind1 = document.getElementById('step-ind-1');
    const ind2 = document.getElementById('step-ind-2');
    const ind3 = document.getElementById('step-ind-3');

    const btnPrev = document.getElementById('btn-nu-prev');
    const btnNext = document.getElementById('btn-nu-next');
    const btnSubmit = document.getElementById('btn-nu-submit');
    const form = document.getElementById('new-user-form');
    const step2Error = document.getElementById('nu-step2-error');

    let currentStep = 1;

    const openModal = () => {
      currentStep = 1;
      showStep(1);
      if (roleWelcomeModal) roleWelcomeModal.classList.remove('active');
      modal?.classList.add('active');
      setTimeout(() => document.getElementById('nu-patient-name')?.focus(), 150);
    };

    const closeModal = () => {
      modal?.classList.remove('active');
    };

    if (btnOpenFromWelcome) btnOpenFromWelcome.addEventListener('click', openModal);
    if (modalClose) modalClose.addEventListener('click', closeModal);

    const showStep = (step) => {
      currentStep = step;
      if (step1) step1.style.display = step === 1 ? 'flex' : 'none';
      if (step2) step2.style.display = step === 2 ? 'flex' : 'none';
      if (step3) step3.style.display = step === 3 ? 'flex' : 'none';

      // Indicators
      [ind1, ind2, ind3].forEach((ind, i) => {
        if (!ind) return;
        const num = ind.querySelector('.step-num');
        if (i + 1 === step) {
          ind.classList.add('active');
          ind.classList.remove('completed');
          if (num) num.style.background = '#059669';
        } else if (i + 1 < step) {
          ind.classList.add('completed');
          ind.classList.remove('active');
          if (num) num.style.background = '#10b981';
        } else {
          ind.classList.remove('active', 'completed');
          if (num) num.style.background = '#e2e8f0';
        }
      });

      // Buttons
      if (btnPrev) btnPrev.style.display = step > 1 ? 'block' : 'none';
      if (btnNext) btnNext.style.display = step < 3 ? 'block' : 'none';
      if (btnSubmit) btnSubmit.style.display = step === 3 ? 'block' : 'none';
    };

    if (btnPrev) {
      btnPrev.addEventListener('click', () => {
        if (currentStep > 1) showStep(currentStep - 1);
      });
    }

    if (btnNext) {
      btnNext.addEventListener('click', () => {
        if (currentStep === 1) {
          const name = document.getElementById('nu-patient-name')?.value.trim();
          const preferred = document.getElementById('nu-patient-preferred')?.value.trim();
          if (!name || !preferred) {
            showToast('Please enter the patient full name and greeting name');
            return;
          }
          showStep(2);
        } else if (currentStep === 2) {
          const pin = document.getElementById('nu-cg-pin')?.value.trim();
          const pinConfirm = document.getElementById('nu-cg-pin-confirm')?.value.trim();
          if (pin && pin.length < 4) {
            if (step2Error) {
              step2Error.textContent = '⚠️ Passcode must be at least 4 digits.';
              step2Error.style.display = 'block';
            }
            return;
          }
          if (pin && pinConfirm && pin !== pinConfirm) {
            if (step2Error) {
              step2Error.textContent = '⚠️ Passcodes do not match.';
              step2Error.style.display = 'block';
            }
            return;
          }
          if (step2Error) step2Error.style.display = 'none';
          showStep(3);
        }
      });
    }

    if (form) {
      form.addEventListener('submit', (e) => {
        e.preventDefault();

        const profileData = {
          name: document.getElementById('nu-patient-name')?.value.trim() || 'Patient',
          preferredName: document.getElementById('nu-patient-preferred')?.value.trim() || 'Friend',
          age: parseInt(document.getElementById('nu-patient-age')?.value, 10) || 70,
          gender: document.getElementById('nu-patient-gender')?.value || 'Female',
          stage: document.getElementById('nu-patient-stage')?.value || 'Early-Stage Dementia',
          notes: document.getElementById('nu-patient-notes')?.value.trim() || '',
          caregiverName: document.getElementById('nu-cg-name')?.value.trim() || 'Primary Caregiver',
          caregiverRelation: document.getElementById('nu-cg-relation')?.value.trim() || 'Family Caregiver',
          emergencyPhone: document.getElementById('nu-cg-phone')?.value.trim() || '+1 (555) 000-0000',
          caregiverEmail: document.getElementById('nu-cg-email')?.value.trim() || '',
          pin: document.getElementById('nu-cg-pin')?.value.trim() || '1234',
          doctorName: document.getElementById('nu-doc-name')?.value.trim() || 'Family Physician',
          doctorPhone: document.getElementById('nu-doc-phone')?.value.trim() || '',
          homeAddress: document.getElementById('nu-home-address')?.value.trim() || 'Home'
        };

        const chosenLang = document.getElementById('nu-language')?.value || 'en';

        // Save fresh patient & caretaker
        window.smritiData.createNewPatientProfile(profileData);

        // Language preference sync
        if (window.smritiI18n && window.smritiI18n.getLanguage() !== chosenLang) {
          window.smritiI18n.setLanguage(chosenLang);
        }

        closeModal();
        switchPortal('patient');

        const isHi = chosenLang === 'hi';
        const toastMsg = isHi 
          ? `नमस्ते ${profileData.preferredName}! नई प्रोफ़ाइल सफलतापूर्वक बनाई गई।`
          : `Welcome ${profileData.preferredName}! Fresh care profile initialized.`;
        showToast(toastMsg);

        setTimeout(() => {
          window.smritiSpeech.speak(isHi 
            ? `नमस्ते ${profileData.preferredName}! स्मृति में आपका स्वागत है। आपकी दैनिक गतिविधियों में हम आपके साथ हैं।`
            : `Welcome to Smriti, ${profileData.preferredName}! Your personalized cognitive companion is ready.`
          );
        }, 600);
      });
    }
  }

  /* ---------------------------------------------------------
     Community & Volunteer Contribution Hub
     --------------------------------------------------------- */
  function setupCommunityHub() {
    const modal = document.getElementById('community-hub-modal');
    const modalClose = document.getElementById('community-hub-modal-close');
    const btnHeaderContribute = document.getElementById('btn-header-contribute');
    const btnOpenFromWelcome = document.getElementById('btn-open-community-hub');
    const btnQuickShareTip = document.getElementById('btn-quick-share-tip');
    const roleWelcomeModal = document.getElementById('role-welcome-modal');

    const tabBtns = document.querySelectorAll('.comm-tab-btn');
    const tabPanels = {
      gallery: document.getElementById('panel-comm-gallery'),
      tip: document.getElementById('panel-comm-tip'),
      game: document.getElementById('panel-comm-game'),
      volunteer: document.getElementById('panel-comm-volunteer')
    };

    const container = document.getElementById('community-cards-container');

    const openModal = (defaultTab = 'gallery') => {
      if (roleWelcomeModal) roleWelcomeModal.classList.remove('active');
      switchTab(defaultTab);
      modal?.classList.add('active');
      renderCards();
    };

    const closeModal = () => {
      modal?.classList.remove('active');
    };

    if (btnHeaderContribute) btnHeaderContribute.addEventListener('click', () => openModal('gallery'));
    if (btnOpenFromWelcome) btnOpenFromWelcome.addEventListener('click', () => openModal('gallery'));
    if (btnQuickShareTip) btnQuickShareTip.addEventListener('click', () => switchTab('tip'));
    if (modalClose) modalClose.addEventListener('click', closeModal);

    const switchTab = (tabName) => {
      tabBtns.forEach(b => {
        if (b.getAttribute('data-tab') === tabName) {
          b.classList.add('active');
          b.style.color = '#5b21b6';
          b.style.borderBottomColor = '#5b21b6';
        } else {
          b.classList.remove('active');
          b.style.color = '#64748b';
          b.style.borderBottomColor = 'transparent';
        }
      });

      Object.entries(tabPanels).forEach(([name, panel]) => {
        if (panel) {
          panel.style.display = name === tabName ? 'flex' : 'none';
        }
      });

      if (tabName === 'gallery') {
        renderCards();
      }
    };

    tabBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const tab = btn.getAttribute('data-tab');
        switchTab(tab);
      });
    });

    // Form 1: Share Tip
    const formTip = document.getElementById('form-contrib-tip');
    if (formTip) {
      formTip.addEventListener('submit', (e) => {
        e.preventDefault();
        const author = document.getElementById('tip-author')?.value.trim() || 'Caregiver';
        const role = document.getElementById('tip-author-role')?.value || 'Family Caregiver';
        const category = document.getElementById('tip-category')?.value || 'Sundowning & Calming';
        const title = document.getElementById('tip-title')?.value.trim() || 'Caregiver Tip';
        const content = document.getElementById('tip-content')?.value.trim() || '';

        if (!content) return;

        window.smritiData.addCommunityContribution({
          type: 'tip',
          title,
          category,
          author,
          authorRole: role,
          content
        });

        formTip.reset();
        showToast('Thank you! Your caregiving tip has been published to the community.');
        window.smritiSpeech.speak('Thank you for sharing your tip with the caregiver community.');
        switchTab('gallery');
      });
    }

    // Form 2: Contribute Game
    const formGame = document.getElementById('form-contrib-game');
    if (formGame) {
      formGame.addEventListener('submit', (e) => {
        e.preventDefault();
        const title = document.getElementById('game-title')?.value.trim() || 'Memory Game';
        const category = document.getElementById('game-category')?.value || 'Object Recognition';
        const author = document.getElementById('game-author')?.value.trim() || 'Contributor';
        const content = document.getElementById('game-content')?.value.trim() || '';

        if (!content) return;

        window.smritiData.addCommunityContribution({
          type: 'game',
          title,
          category,
          author,
          authorRole: 'Activity Contributor',
          content
        });

        formGame.reset();
        showToast('Activity submitted! Thank you for supporting dementia cognitive health.');
        window.smritiSpeech.speak('Thank you for contributing a memory activity.');
        switchTab('gallery');
      });
    }

    // Form 3: Volunteer Support
    const formVolunteer = document.getElementById('form-contrib-volunteer');
    if (formVolunteer) {
      formVolunteer.addEventListener('submit', (e) => {
        e.preventDefault();
        const name = document.getElementById('vol-name')?.value.trim() || 'Volunteer';
        const service = document.getElementById('vol-service')?.value || 'Companion Support';
        const city = document.getElementById('vol-city')?.value.trim() || 'Community';
        const notes = document.getElementById('vol-notes')?.value.trim() || '';

        if (!notes) return;

        window.smritiData.addCommunityContribution({
          type: 'volunteer',
          title: `${service} (${city})`,
          category: 'Volunteer Support',
          author: name,
          authorRole: 'Community Volunteer',
          content: notes
        });

        formVolunteer.reset();
        showToast('Thank you for joining as a volunteer supporter!');
        window.smritiSpeech.speak('Thank you for offering your volunteer support.');
        switchTab('gallery');
      });
    }

    // Render Cards in Gallery
    function renderCards() {
      if (!container) return;
      const contributions = window.smritiData.getCommunityContributions();

      container.innerHTML = contributions.map(item => {
        const tagClass = item.type === 'game' ? 'game' : item.type === 'volunteer' ? 'volunteer' : 'tip';
        const typeIcon = item.type === 'game' ? '🎮 Game' : item.type === 'volunteer' ? '🙋 Volunteer' : '💡 Tip';

        return `
          <div class="community-card" data-id="${item.id}">
            <div class="comm-card-header">
              <div>
                <span class="comm-card-tag ${tagClass}">${typeIcon} • ${item.category}</span>
                <h5 class="comm-card-title">${item.title}</h5>
              </div>
              <button type="button" class="btn-upvote" data-id="${item.id}" title="Support this insight">
                <span>❤️</span> <span>${item.upvotes || 0}</span>
              </button>
            </div>
            <p class="comm-card-body">${item.content}</p>
            <div class="comm-card-footer">
              <span>By <strong>${item.author}</strong> (${item.authorRole || 'Contributor'})</span>
              <span>${item.date || 'Recent'}</span>
            </div>
          </div>
        `;
      }).join('');

      // Upvote buttons
      container.querySelectorAll('.btn-upvote').forEach(btn => {
        btn.addEventListener('click', () => {
          const id = parseInt(btn.getAttribute('data-id'), 10);
          window.smritiData.upvoteCommunityContribution(id);
          if (window.smritiAudio) window.smritiAudio.playChime();
          renderCards();
        });
      });
    }

    window.addEventListener('smriti_community_updated', () => {
      renderCards();
    });
  }

  /* ---------------------------------------------------------
     Live Event Listeners for State Updates
     --------------------------------------------------------- */
  function listenForDataUpdates() {
    window.addEventListener('smriti_score_updated', () => {
      refreshPatientStatus();
      refreshCaregiverDashboard();
    });

    window.addEventListener('smriti_mood_updated', () => {
      if (state.currentPortal === 'caregiver') {
        refreshCaregiverDashboard();
      }
    });

    window.addEventListener('smriti_profile_updated', () => {
      setupDateTimeGreeting();
      if (state.currentPortal === 'caregiver') {
        refreshCaregiverDashboard();
      }
    });
  }

  /* ---------------------------------------------------------
     Toast Feedback Helper
     --------------------------------------------------------- */
  function showToast(message) {
    let container = document.getElementById('toast-container');
    if (!container) {
      container = document.createElement('div');
      container.id = 'toast-container';
      container.className = 'toast-container';
      document.body.appendChild(container);
    }

    const toast = document.createElement('div');
    toast.className = 'toast';
    toast.innerHTML = `<span>💬</span><span>${message}</span>`;
    container.appendChild(toast);

    setTimeout(() => {
      toast.style.opacity = '0';
      toast.style.transform = 'translateY(10px)';
      toast.style.transition = '0.3s ease';
      setTimeout(() => toast.remove(), 300);
    }, 2800);
  }
});
