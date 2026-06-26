const terminalContent = document.getElementById('terminal-content');

const prefixes = {
  system_init: '[SYS_BOOT]',
  tower_build: '[TOWER_BUILT]',
  tower_upgrade: '[TOWER_UPGRADE]',
  tower_sell: '[TOWER_SOLD]',
  wave_start: '[WAVE_INCOMING]',
  wave_clear: '[WAVE_CLEARED]',
  enemy_kill: '[TARGET_NEUTRALIZED]',
  enemy_leak: '[PERIMETER_BREACH]',
  boss_wave: '[BOSS_ALERT]',
  gold_earned: '[RESOURCES_ACQUIRED]',
  pause: '[CHRONO_SUSPEND]',
  resume: '[CHRONO_RESUME]',
  audio_on: '[AUDIO_SYS_ON]',
  audio_off: '[AUDIO_SYS_OFF]',
  settings: '[SYS_CONFIG]',
  fatal_error: '[KERNEL_PANIC_0xDEADCODE]',
  victory: '[REALM_SECURED]',
};

export function addTerminalLine(text, type = 'info') {
  const line = document.createElement('div');
  line.className = 'terminal-line';

  let prefix = '[LOG_INFO]';
  if (prefixes[type]) prefix = prefixes[type];

  let styledText = text;
  if (type === 'fatal_error')
    styledText = `//_! ${text.toUpperCase().replace(/\s/g, '_')} !// :: DEFENSES_BREACHED :: REALM_LOST`;
  if (type === 'wave_start')
    styledText = `INCOMING_HOSTILES :: ${text} :: FORTIFY_POSITIONS`;
  if (type === 'wave_clear')
    styledText = `//** ${text.replace(/\s/g, '_')} :: PERIMETER_HELD **//`;
  if (type === 'boss_wave')
    styledText = `!!! HEART_BOSS_DETECTED :: ${text} :: ALL_TOWERS_STANDBY !!!`;
  if (type === 'tower_build')
    styledText = `CONSTRUCTING_DEFENSE :: ${text} :: POSITION_SECURED`;
  if (type === 'tower_upgrade')
    styledText = `FORTIFICATION_ENHANCED :: ${text} :: COMBAT_EFFICIENCY_INCREASED`;
  if (type === 'victory')
    styledText = `//** //** REALM_SECURED :: ${text.replace(/\s/g, '_')} :: 50_WAVES_SURVIVED :: WONDERLAND_PRESERVED **// **//`;

  line.textContent = `${prefix} :: ${styledText}`;
  const typingLine = terminalContent.querySelector('.typing');
  if (typingLine) typingLine.classList.remove('typing');
  terminalContent.appendChild(line);
  const newTypingLine = document.createElement('div');
  newTypingLine.className = 'terminal-line typing';
  terminalContent.appendChild(newTypingLine);
  terminalContent.scrollTop = terminalContent.scrollHeight;
  const lines = terminalContent.querySelectorAll('.terminal-line:not(.typing)');
  if (lines.length > 60) lines[0].remove();
}
