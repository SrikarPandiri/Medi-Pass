/**
 * @file client/js/components/storyRing.js
 * @description Instagram-style Health Highlights story rings row with seen/unseen indicators
 * and interactive full-screen story viewer overlay with timed progress bars.
 */

export class StoryRing {
  static stories = [
    { id: 'blood', title: 'Blood Group', icon: '🩸', subtitle: 'O+ Positive', bg: 'bg-rose-500' },
    { id: 'allergy', title: 'Allergies', icon: '🚨', subtitle: 'Penicillin (Severe)', bg: 'bg-amber-500' },
    { id: 'meds', title: 'Medicines', icon: '💊', subtitle: '2 Active Prescriptions', bg: 'bg-teal-500' },
    { id: 'labs', title: 'Lab Reports', icon: '📊', subtitle: 'HbA1c: 7.8%', bg: 'bg-blue-500' },
    { id: 'emergency', title: 'Emergency', icon: '🆘', subtitle: 'Card & Contact', bg: 'bg-red-600' }
  ];

  static renderRow(seenIds = new Set()) {
    let html = '<div class="flex gap-4 overflow-x-auto no-scrollbar py-3 px-1">';
    for (const story of this.stories) {
      const isSeen = seenIds.has(story.id);
      html += `
        <div class="story-ring-wrapper" data-story-id="${story.id}">
          <div class="${isSeen ? 'story-ring-seen' : 'story-ring-unseen'}">
            <div class="story-avatar-inner text-2xl">
              ${story.icon}
            </div>
          </div>
          <span class="text-[11px] font-medium text-[var(--text)] whitespace-nowrap">${story.title}</span>
        </div>
      `;
    }
    html += '</div>';
    return html;
  }

  static openViewer(storyId, patientData = {}) {
    const story = this.stories.find(s => s.id === storyId) || this.stories[0];

    const overlay = document.createElement('div');
    overlay.className = 'story-overlay animate-fade-in';
    overlay.id = 'active-story-viewer';

    let contentHtml = '';
    if (story.id === 'blood') {
      contentHtml = `
        <div class="my-auto text-center space-y-4">
          <div class="w-24 h-24 mx-auto rounded-full bg-rose-600 flex items-center justify-center text-4xl shadow-2xl">
            🩸
          </div>
          <h2 class="text-3xl font-extrabold">Blood Group: O+</h2>
          <p class="text-slate-300 text-sm max-w-xs mx-auto">Verified Rh-positive donor status under State Blood Transfusion Council records.</p>
        </div>
      `;
    } else if (story.id === 'allergy') {
      contentHtml = `
        <div class="my-auto text-center space-y-4">
          <div class="w-24 h-24 mx-auto rounded-full bg-amber-600 flex items-center justify-center text-4xl shadow-2xl">
            🚨
          </div>
          <h2 class="text-2xl font-bold text-amber-300">Severe Penicillin Allergy</h2>
          <div class="bg-black/40 p-4 rounded-2xl text-sm text-left max-w-sm mx-auto space-y-1">
            <p><strong>Reaction:</strong> Generalized urticaria, facial angioedema</p>
            <p><strong>Contraindications:</strong> Amoxicillin, Ampicillin, Beta-Lactams</p>
          </div>
        </div>
      `;
    } else if (story.id === 'emergency') {
      contentHtml = `
        <div class="my-auto text-center space-y-4">
          <div class="w-24 h-24 mx-auto rounded-full bg-red-600 flex items-center justify-center text-4xl shadow-2xl">
            🆘
          </div>
          <h2 class="text-2xl font-bold">Emergency Card</h2>
          <div class="bg-black/50 p-4 rounded-2xl text-sm max-w-sm mx-auto text-left space-y-2">
            <p><strong>Patient:</strong> ${patientData.name || 'Lakshmi Devi'}</p>
            <p><strong>ABHA ID:</strong> ${patientData.abha_id || '91-2345-6789-0123'}</p>
            <p><strong>Emergency Contact:</strong> ${patientData.emergency_contact_phone || '+919876543299'}</p>
            <p><strong>Primary Doctor:</strong> Dr. Anita Rao (Sunrise Clinic)</p>
          </div>
        </div>
      `;
    } else {
      contentHtml = `
        <div class="my-auto text-center space-y-4">
          <div class="w-24 h-24 mx-auto rounded-full ${story.bg} flex items-center justify-center text-4xl shadow-2xl">
            ${story.icon}
          </div>
          <h2 class="text-2xl font-bold">${story.title}</h2>
          <p class="text-slate-200 text-sm">${story.subtitle}</p>
        </div>
      `;
    }

    overlay.innerHTML = `
      <div class="story-progress-bar-container">
        <div class="story-progress-segment">
          <div class="story-progress-fill" id="story-progress"></div>
        </div>
      </div>
      <div class="flex items-center justify-between mt-3">
        <div class="flex items-center gap-2">
          <span class="text-lg">${story.icon}</span>
          <span class="font-bold text-sm">${story.title}</span>
        </div>
        <button id="close-story-btn" class="p-1 rounded-full bg-white/20 text-white font-bold">&times;</button>
      </div>
      ${contentHtml}
      <div class="text-center text-xs text-slate-400 pb-2">
        Tap anywhere to close
      </div>
    `;

    document.body.appendChild(overlay);

    const progressEl = overlay.querySelector('#story-progress');
    let width = 0;
    const interval = setInterval(() => {
      width += 2;
      if (progressEl) progressEl.style.width = `${width}%`;
      if (width >= 100) {
        clearInterval(interval);
        overlay.remove();
      }
    }, 80);

    const closeStory = () => {
      clearInterval(interval);
      overlay.remove();
    };

    overlay.addEventListener('click', closeStory);
    overlay.querySelector('#close-story-btn')?.addEventListener('click', (e) => {
      e.stopPropagation();
      closeStory();
    });
  }
}

export default StoryRing;
