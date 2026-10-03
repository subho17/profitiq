(function(){
  var dataItems = [
    { name:'EBR with booking number',       type:'match'  },
    { name:'Tally Sales Register — Vehicles', type:'flag',  finding:'DMS retail vs Tally variance: 18 units', severity:'warn' },
    { name:'Tally Sales Register — Accessories', type:'match' },
    { name:'Delivery Report (DMS)',          type:'match'  },
    { name:'DMS Sales Register — Accessories', type:'match' },
    { name:'Trade-in Sales Register',        type:'flag',  finding:'Trade-in stock: 3 vehicles unsold beyond 60-day window', severity:'p1' },
    { name:'Trade-in Stock Register',        type:'match'  },
    { name:'Vehicle Registration Data',      type:'match'  },
    { name:'Bank Statements',               type:'flag',  finding:'Bank receipt ₹1,01,645 — third-party payment flagged', severity:'p1' },
    { name:'Cash Ledger',                   type:'flag',  finding:'Cash ledger vs audit file: ₹85,000 unrecorded cash', severity:'p1' },
    { name:'EW Punched in DMS',             type:'flag',  finding:'EW DMS punched: 223 · Audit file: 97 · Variance: 126 units', severity:'p1' },
    { name:'EW Ledger (Tally)',             type:'match'  },
    { name:'SP + RSA Punched in DMS',       type:'match'  },
    { name:'Claims Punched in DMS',         type:'match'  },
    { name:'DSA Ledger',                    type:'flag',  finding:'DSA payout vs approved: ₹32,000 excess', severity:'warn' },
    { name:'Insurance Dump with OD%',       type:'flag',  finding:'8 self-insurance cases — confirmed dealer-arranged via tele-calling', severity:'p1' },
    { name:'Insurance Payout Invoices',     type:'match'  },
    { name:'Workshop Accessory Sales',      type:'flag',  finding:'Workshop cash jobs: 4 not entered in DMS', severity:'warn' },
    { name:'Workshop Sale Report',          type:'match'  },
    { name:'Leasing Company Ledger',        type:'match'  },
    { name:'GSTR-1 JSON',                   type:'flag',  finding:'GSTR-1 vs DMS retail: 6-unit count discrepancy', severity:'warn' },
    { name:'Vehicle Stock Report',          type:'match'  },
    { name:'Finance Data',                  type:'match'  }
  ];

  var flags = dataItems.filter(function(d){ return d.type === 'flag'; });
  var reconFeed   = document.getElementById('recon-feed');
  var flagsFeed   = document.getElementById('flags-feed');
  var reconBar    = document.getElementById('recon-bar');
  var reconCtr    = document.getElementById('recon-counter');
  var flagCtr     = document.getElementById('flag-counter');
  var agentMsg    = document.getElementById('agent-message');
  var statMatched = document.getElementById('stat-matched');
  var statFlagged = document.getElementById('stat-flagged');
  var statPending = document.getElementById('stat-pending');

  var idx = 0;
  var matchCount = 0;
  var flagCount  = 0;
  var running    = false;

  function renderReconItem(item, num) {
    var el = document.createElement('div');
    var isFlag = item.type === 'flag';
    el.style.cssText = 'display:flex;align-items:center;gap:10px;padding:8px 10px;border-radius:8px;animation:reconSlide .3s ease both;background:' + (isFlag ? 'rgba(232,51,74,.08)' : 'rgba(255,255,255,.04)') + ';border:1px solid ' + (isFlag ? 'rgba(232,51,74,.2)' : 'rgba(255,255,255,.06)') + ';flex-shrink:0';
    var numEl = document.createElement('span');
    numEl.style.cssText = 'font-family:var(--fd);font-size:10px;font-weight:700;color:rgba(255,255,255,.3);min-width:18px;flex-shrink:0';
    numEl.textContent = String(num).padStart(2,'0');
    var nameEl = document.createElement('span');
    nameEl.style.cssText = 'font-size:12px;color:rgba(255,255,255,.7);flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis;white-space:nowrap';
    nameEl.textContent = item.name;
    var badge = document.createElement('span');
    badge.style.cssText = 'font-size:10px;font-weight:700;padding:2px 8px;border-radius:10px;flex-shrink:0;' + (isFlag ? 'background:rgba(232,51,74,.2);color:#ff8099' : 'background:rgba(0,184,118,.15);color:var(--green)');
    badge.textContent = isFlag ? '⚑ FLAGGED' : '✓ MATCH';
    el.appendChild(numEl);
    el.appendChild(nameEl);
    el.appendChild(badge);
    return el;
  }

  function renderFlag(item) {
    var sev = item.severity;
    var colors = sev === 'p1'
      ? { bg:'rgba(232,51,74,.1)', border:'rgba(232,51,74,.35)', label:'P1 VARIANCE', lc:'#ff8099', tc:'rgba(255,255,255,.75)' }
      : { bg:'rgba(217,119,6,.08)', border:'rgba(217,119,6,.3)',  label:'VARIANCE',   lc:'#fbbf24', tc:'rgba(255,255,255,.65)' };
    var el = document.createElement('div');
    el.style.cssText = 'padding:10px 14px;border-radius:10px;border:1px solid ' + colors.border + ';background:' + colors.bg + ';animation:flagPop .35s ease both';
    var top = document.createElement('div');
    top.style.cssText = 'display:flex;align-items:center;gap:8px;margin-bottom:5px';
    var icon = document.createElement('span');
    icon.style.cssText = 'font-size:14px';
    icon.textContent = sev === 'p1' ? '🚨' : '⚠️';
    var lbl = document.createElement('span');
    lbl.style.cssText = 'font-size:10px;font-weight:800;letter-spacing:.08em;color:' + colors.lc;
    lbl.textContent = colors.label;
    var src = document.createElement('span');
    src.style.cssText = 'font-size:10px;color:rgba(255,255,255,.35);margin-left:auto;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;max-width:140px';
    src.textContent = item.name;
    top.appendChild(icon); top.appendChild(lbl); top.appendChild(src);
    var finding = document.createElement('div');
    finding.style.cssText = 'font-size:12px;font-weight:500;color:' + colors.tc + ';line-height:1.45';
    finding.textContent = item.finding;
    el.appendChild(top); el.appendChild(finding);
    return el;
  }

  function step() {
    if (idx >= dataItems.length) {
      // done
      agentMsg.textContent = 'Reconciliation complete · ' + flagCount + ' variance' + (flagCount !== 1 ? 's' : '') + ' flagged · report ready';
      agentMsg.style.color = flagCount > 0 ? '#fbbf24' : 'var(--green)';
      setTimeout(reset, 5000);
      return;
    }

    var item = dataItems[idx];
    idx++;

    // Update agent message
    agentMsg.textContent = 'Processing: ' + item.name + '...';

    // Add to recon feed (max 8 visible)
    var reconEl = renderReconItem(item, idx);
    reconFeed.insertBefore(reconEl, reconFeed.firstChild);
    if (reconFeed.children.length > 8) {
      reconFeed.removeChild(reconFeed.lastChild);
    }

    // Update counters
    if (item.type === 'match') {
      matchCount++;
    } else {
      flagCount++;
      flagCtr.textContent = flagCount;
      // Add to flags panel
      var flagEl = renderFlag(item);
      flagsFeed.insertBefore(flagEl, flagsFeed.firstChild);
      if (flagsFeed.children.length > 5) {
        flagsFeed.removeChild(flagsFeed.lastChild);
      }
    }

    // Update progress
    var pct = Math.round((idx / dataItems.length) * 100);
    reconBar.style.width = pct + '%';
    reconCtr.textContent = idx + '/23';
    statMatched.textContent = matchCount;
    statFlagged.textContent = flagCount;
    statPending.textContent = (dataItems.length - idx);

    // Schedule next
    var delay = item.type === 'flag' ? 1100 : 620;
    setTimeout(step, delay);
  }

  function reset() {
    idx = 0; matchCount = 0; flagCount = 0;
    reconFeed.innerHTML = '';
    flagsFeed.innerHTML = '';
    reconBar.style.width = '0%';
    reconCtr.textContent = '0/23';
    flagCtr.textContent = '0';
    statMatched.textContent = '—';
    statFlagged.textContent = '—';
    statPending.textContent = '23';
    agentMsg.textContent = 'AI agent initialising...';
    agentMsg.style.color = 'var(--green)';
    setTimeout(step, 800);
  }

  // Start when section enters viewport
  var observer = new IntersectionObserver(function(entries){
    entries.forEach(function(e){
      if (e.isIntersecting && !running) {
        running = true;
        setTimeout(step, 600);
        observer.disconnect();
      }
    });
  }, { threshold: 0.3 });

  var section = document.getElementById('recon-engine');
  if (section) observer.observe(section);
})();
// NAV
window.addEventListener('scroll',()=>document.getElementById('nav').classList.toggle('sc',window.scrollY>40));

// MOBILE MENU
function oM(){document.getElementById('mob').classList.add('open');document.body.style.overflow='hidden'}
function cM(){document.getElementById('mob').classList.remove('open');document.body.style.overflow=''}

// SCROLL REVEAL
const rvEls=document.querySelectorAll('.rv');
const ro=new IntersectionObserver((es)=>{es.forEach((e,i)=>{if(e.isIntersecting){setTimeout(()=>e.target.classList.add('in'),i*70);ro.unobserve(e.target)}})},{threshold:.08,rootMargin:'0px 0px -30px 0px'});
rvEls.forEach(el=>ro.observe(el));

// SMOOTH SCROLL
document.querySelectorAll('a[href^="#"]').forEach(a=>{a.addEventListener('click',e=>{const id=a.getAttribute('href');if(id==='#')return;const el=document.querySelector(id);if(el){e.preventDefault();el.scrollIntoView({behavior:'smooth',block:'start'})}})});


// ROI CALCULATOR
function fmt(n) {
  if (n >= 10000000) return '₹' + (n/10000000).toFixed(1) + ' Cr';
  if (n >= 100000)  return '₹' + (n/100000).toFixed(1) + 'L';
  return '₹' + n.toLocaleString('en-IN');
}
function fmtPlain(n) { return n.toLocaleString('en-IN'); }

function calcROI() {
  var deliveries   = +document.getElementById('s-deliveries').value;
  var discount     = +document.getElementById('s-discount').value;
  var reduction    = +document.getElementById('s-reduction').value / 100;
  var insCount     = +document.getElementById('s-insurance').value;
  var commission   = +document.getElementById('s-commission').value;

  // Update slider display values
  document.getElementById('v-deliveries').textContent = deliveries;
  document.getElementById('v-discount-num').textContent = fmtPlain(discount);
  document.getElementById('v-reduction-num').textContent = Math.round(reduction*100);
  document.getElementById('v-insurance-num').textContent = insCount;
  document.getElementById('v-commission-num').textContent = fmtPlain(commission);

  var discountSaving    = Math.round(discount * reduction * deliveries);
  var insuranceRecovery = Math.round(insCount * 0.67 * commission);
  var deterrence        = Math.round((discountSaving + insuranceRecovery) * 0.20);
  var total             = discountSaving + insuranceRecovery + deterrence;

  document.getElementById('r-discount').textContent    = fmt(discountSaving);
  document.getElementById('r-insurance').textContent   = fmt(insuranceRecovery);
  document.getElementById('r-deterrence').textContent  = fmt(deterrence);
  document.getElementById('r-total').textContent       = fmt(total);
}

['s-deliveries','s-discount','s-reduction','s-insurance','s-commission'].forEach(function(id){
  var el = document.getElementById(id);
  if (el) el.addEventListener('input', calcROI);
});
calcROI(); // initialise on load

// CYCLING WORD ANIMATION
const words=['leaks','loses','wastes','bleeds'];
let idx=0;
const cw=document.getElementById('cw');

function cycle(){
  cw.classList.add('striking');
  setTimeout(()=>{
    cw.classList.add('fading');
    setTimeout(()=>{
      idx=(idx+1)%words.length;
      cw.textContent=words[idx];
      cw.classList.remove('striking','fading');
      cw.classList.add('entering');
      setTimeout(()=>cw.classList.remove('entering'),350);
      setTimeout(cycle,2600);
    },260);
  },420);
}
setTimeout(cycle,2800);

// SUB-BANNER
var snActive   = null;
var snSelected = null;  // tracks which sub-banner item is highlighted

function toggleSN(group) {
  var subnav = document.getElementById('subnav');
  var tabP   = document.getElementById('tab-platform');
  var tabC   = document.getElementById('tab-company');
  var snP    = document.getElementById('sn-platform');
  var snC    = document.getElementById('sn-company');
  if (snActive === group) {
    // toggle closed — keep green on parent if a child was selected
    subnav.classList.remove('visible');
    if (!snSelected || (group === 'platform' && !['sol','recon','roi','how'].includes(snSelected))
                    || (group === 'company'  && !['team','testi'].includes(snSelected))) {
      tabP.parentElement.classList.remove('ntab-active');
      tabC.parentElement.classList.remove('ntab-active');
    }
    snActive = null;
  } else {
    snActive = group;
    subnav.classList.add('visible');
    if (group === 'platform') {
      snP.style.display = 'flex';
      snC.style.display = 'none';
      tabP.parentElement.classList.add('ntab-active');
      tabC.parentElement.classList.remove('ntab-active');
    } else {
      snP.style.display = 'none';
      snC.style.display = 'flex';
      tabC.parentElement.classList.add('ntab-active');
      tabP.parentElement.classList.remove('ntab-active');
    }
  }
}

// Called when a sub-banner item is clicked — highlight it in green
function selectSNItem(el) {
  // Clear all sub-banner selected states
  document.querySelectorAll('.subnav a').forEach(function(a){ a.classList.remove('sn-selected'); });
  // Set selected on clicked item
  el.classList.add('sn-selected');
  snSelected = el.getAttribute('data-sn');
  // Keep parent tab green
  var tabP = document.getElementById('tab-platform');
  var tabC = document.getElementById('tab-company');
  var platformItems = ['sol','recon','roi','how'];
  var companyItems  = ['team','testi'];
  if (platformItems.includes(snSelected)) {
    tabP.parentElement.classList.add('ntab-active');
    tabC.parentElement.classList.remove('ntab-active');
  } else if (companyItems.includes(snSelected)) {
    tabC.parentElement.classList.add('ntab-active');
    tabP.parentElement.classList.remove('ntab-active');
  }
}

// Close sub-banner after navigation (with small delay so scroll starts first)
function closeSNAfterNav() {
  setTimeout(function(){
    var subnav = document.getElementById('subnav');
    if (subnav) subnav.classList.remove('visible');
    snActive = null;
  }, 300);
}

function closeSN() {
  var subnav = document.getElementById('subnav');
  if (subnav) subnav.classList.remove('visible');
  // Only remove primary tab highlight if no child is selected
  if (!snSelected) {
    ['tab-platform','tab-company'].forEach(function(id){
      var el = document.getElementById(id);
      if (el) el.parentElement.classList.remove('ntab-active');
    });
  }
  snActive = null;
}

// Standalone nav links (Industries, For Investors) — highlight on click
document.querySelectorAll('.nlinks>li>a').forEach(function(a){
  a.addEventListener('click', function(){
    // Clear all primary active states
    document.querySelectorAll('.nlinks>li').forEach(function(li){ li.classList.remove('nav-section-active'); });
    a.parentElement.classList.add('nav-section-active');
    // Clear sub-banner selection
    document.querySelectorAll('.subnav a').forEach(function(sa){ sa.classList.remove('sn-selected'); });
    snSelected = null;
    closeSN();
  });
});

// Close sub-banner on outside click
document.addEventListener('click', function(e) {
  var inNav    = e.target.closest('#nav');
  var inSubnav = e.target.closest('#subnav');
  if (!inNav && !inSubnav) closeSN();
});

// Scroll-driven active state — highlight parent tab based on visible section
var sectionMap = {
  'sol':          'platform', 'how':      'platform',
  'recon-engine': 'platform', 'roi':      'platform',
  'verts':        'verts',    'inv':      'inv',
  'team':         'company',  'testi':    'company',
};
var allSectionIds = ['sol','how','recon-engine','roi','verts','inv','team','testi','demo'];
var scrollTimer;
window.addEventListener('scroll', function(){
  // Close sub-banner on scroll (unless just clicked)
  clearTimeout(scrollTimer);
  scrollTimer = setTimeout(function(){
    if (snActive) {
      var subnav = document.getElementById('subnav');
      if (subnav) subnav.classList.remove('visible');
      snActive = null;
    }
  }, 100);

  // Scroll-driven highlight
  var current = null;
  allSectionIds.forEach(function(id){
    var el = document.getElementById(id);
    if (el) {
      var rect = el.getBoundingClientRect();
      if (rect.top <= 120 && rect.bottom > 120) current = id;
    }
  });
  if (!current) return;

  var group = sectionMap[current];
  var tabP = document.getElementById('tab-platform');
  var tabC = document.getElementById('tab-company');

  // Clear all
  document.querySelectorAll('.nlinks>li').forEach(function(li){ li.classList.remove('nav-section-active'); });
  tabP && tabP.parentElement.classList.remove('ntab-active');
  tabC && tabC.parentElement.classList.remove('ntab-active');

  if (group === 'platform') {
    tabP && tabP.parentElement.classList.add('ntab-active');
  } else if (group === 'company') {
    tabC && tabC.parentElement.classList.add('ntab-active');
  } else if (group === 'verts') {
    // highlight Industries standalone link
    document.querySelectorAll('.nlinks>li>a').forEach(function(a){
      if (a.getAttribute('href') === '#verts') a.parentElement.classList.add('nav-section-active');
    });
  } else if (group === 'inv') {
    // highlight For Investors standalone link
    document.querySelectorAll('.nlinks>li>a').forEach(function(a){
      if (a.getAttribute('href') === '#inv') a.parentElement.classList.add('nav-section-active');
    });
  }
}, { passive: true });

// DEMO FORM PREFILL
var demoBtn = document.getElementById('demo-btn');
if (demoBtn) {
  demoBtn.addEventListener('click', function(e) {
    var name = (document.getElementById('demo-name') || {}).value || '';
    var phone = (document.getElementById('demo-phone') || {}).value || '';
    var company = (document.getElementById('demo-company') || {}).value || '';
    var city = (document.getElementById('demo-city') || {}).value || '';

    if (name || phone || company || city) {
      var subject = encodeURIComponent('ProfitIQ Demo Request: ' + (company || name || 'Dealership Network'));
      var body = encodeURIComponent(
        'Hi ProfitIQ Team,\n\n' +
        'I would like to request a demo of the ProfitIQ profitability audit platform.\n\n' +
        'Details:\n' +
        '• Name: ' + (name || 'Not provided') + '\n' +
        '• Mobile: ' + (phone || 'Not provided') + '\n' +
        '• Dealership / Company: ' + (company || 'Not provided') + '\n' +
        '• City: ' + (city || 'Not provided') + '\n\n' +
        'Looking forward to connecting.'
      );
      demoBtn.setAttribute('href', 'mailto:hi@profitiq.in?subject=' + subject + '&body=' + body);
    }
  });
}