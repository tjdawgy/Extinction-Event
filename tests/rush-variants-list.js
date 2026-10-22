// Rifleman-rush variants shared by rush-variants.js (vs the AI) and duel.js (vs the smart defender)
const B3 = ['barracks', 'barracks', 'barracks'];
// The rush that beats Hard: 3 Barracks + 3 Refineries, nonstop Riflemen, hold at the far field node
// (just outside the enemy HQ's 390 range: all three nodes pay out), then attack with 24
const CALIBRATED = { order: ['barracks', 'refinery', 'barracks', 'barracks', 'refinery', 'refinery'], holdU: 1060, attackAt: 24 };
const VARIANTS = {
  'old bot (2B, wave 8, regroup 3)':      ['rush'],
  '3B stream':                            ['rushx', { order: B3 }],
  '3B wave 8':                            ['rushx', { order: B3, attackAt: 8 }],
  '3B wave 12':                           ['rushx', { order: B3, attackAt: 12 }],
  'B,R,B,B stream':                       ['rushx', { order: ['barracks', 'refinery', 'barracks', 'barracks'] }],
  'B,R,B,B wave 12':                      ['rushx', { order: ['barracks', 'refinery', 'barracks', 'barracks'], attackAt: 12 }],
  'B,R,B,B,R wave 16':                    ['rushx', { order: ['barracks', 'refinery', 'barracks', 'barracks', 'refinery'], attackAt: 16 }],
  'B,R,B,B hold mid, wave 12':            ['rushx', { order: ['barracks', 'refinery', 'barracks', 'barracks'], holdU: 880, attackAt: 12 }],
  'B,R,B,B hold mid, wave 20':            ['rushx', { order: ['barracks', 'refinery', 'barracks', 'barracks'], holdU: 880, attackAt: 20 }],
  'B,R,B,B hold far node, wave 16':       ['rushx', { order: ['barracks', 'refinery', 'barracks', 'barracks'], holdU: 1080, attackAt: 16 }],
  '3B hold mid, wave 12':                 ['rushx', { order: B3, holdU: 880, attackAt: 12 }],
  '3B hold mid, attack at 3:00':          ['rushx', { order: B3, holdU: 880, attackAt: 99, attackT: 180 }],
  'B,R,B,B hold mid, attack at 4:00':     ['rushx', { order: ['barracks', 'refinery', 'barracks', 'barracks'], holdU: 880, attackAt: 99, attackT: 240 }],
  'B,R,R,B,B hold mid, wave 20':          ['rushx', { order: ['barracks', 'refinery', 'refinery', 'barracks', 'barracks'], holdU: 880, attackAt: 20 }],
  'B,R,B,B hold 1060, wave 16':           ['rushx', { order: ['barracks', 'refinery', 'barracks', 'barracks'], holdU: 1060, attackAt: 16 }],
  'B,R,B,B,R hold 1060, wave 20':         ['rushx', { order: ['barracks', 'refinery', 'barracks', 'barracks', 'refinery'], holdU: 1060, attackAt: 20 }],
  'CALIBRATED: B,R,B,B,R,R hold 1060, wave 24': ['rushx', CALIBRATED],
  'B,R,B,B,R,R hold 1060, wave 18':       ['rushx', { ...CALIBRATED, attackAt: 18 }],
  'B,R,B,B,R,R hold 1060, wave 32':       ['rushx', { ...CALIBRATED, attackAt: 32 }],
  'B,R,B,B,R,R hold 880, wave 24':        ['rushx', { ...CALIBRATED, holdU: 880 }],
  'B,R,B,B,R,R no hold, wave 24':         ['rushx', { ...CALIBRATED, holdU: null }],
  'B,R,B,B hold 1060, attack at 6:00':    ['rushx', { order: ['barracks', 'refinery', 'barracks', 'barracks'], holdU: 1060, attackAt: 99, attackT: 360 }],
  '3B hold 1060, wave 16':                ['rushx', { order: B3, holdU: 1060, attackAt: 16 }],
  '3B hold 1060, wave 30':                ['rushx', { order: B3, holdU: 1060, attackAt: 30 }],
};
module.exports = { VARIANTS, CALIBRATED };
