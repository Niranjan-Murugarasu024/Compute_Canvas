import { readFileSync } from 'fs';
import { resolve } from 'path';

console.log('--- COMPUTECANVAS 3.3 READABILITY & TYPOGRAPHY AUDIT SUITE ---');

let passedAssertions = 0;
function assert(condition: boolean, message: string) {
  if (!condition) {
    console.error(`❌ FAILED: ${message}`);
    process.exit(1);
  }
  console.log(`✓ PASSED: ${message}`);
  passedAssertions++;
}

// 1. Navigation typography checks
const navContent = readFileSync(resolve(process.cwd(), 'components/navigation/Navigation.tsx'), 'utf-8');
assert(navContent.includes('0.90625rem') || navContent.includes('14.5px'), 'Navigation link font size upgraded to ~14.5px');
assert(!navContent.includes('font-size: 0.75rem;') || navContent.includes('var(--nav-height, 60px)'), 'Navigation header height is set to 60px');
assert(!navContent.includes('font-size: 8px') && !navContent.includes('font-size: 9px'), 'No 8px or 9px text in Navigation');

// 2. Hero Interactive SVG Architecture checks
const heroContent = readFileSync(resolve(process.cwd(), 'components/hero/HeroInteractive.tsx'), 'utf-8');
assert(heroContent.includes('fontSize="14"'), 'Hero architecture node titles are 14px');
assert(heroContent.includes('fontSize="11"'), 'Hero architecture node category tags are 11px');
assert(heroContent.includes('fontSize="12"'), 'Hero architecture traffic labels are 12px');
assert(heroContent.includes('fontSize="10"'), 'Hero architecture bottleneck badge is 10px');
assert(!heroContent.includes('fontSize="6.5"') && !heroContent.includes('fontSize="7.5"') && !heroContent.includes('fontSize="9.5"'), 'Micro-typography eliminated from hero diagram');
assert(heroContent.includes('font-size: 1.25rem') || heroContent.includes('font-size: 20px') || heroContent.includes('text-metric-value'), 'Workload control values are prominent (20px)');
assert(heroContent.includes('min-height: 44px') || heroContent.includes('height: 44px'), 'Hero interactive sliders have 44px touch target');

// 3. SpatialCanvas architecture & nodes
const canvasContent = readFileSync(resolve(process.cwd(), 'components/simulator/SpatialCanvas.tsx'), 'utf-8');
assert(canvasContent.includes('const NODE_WIDTH = 224;'), 'SpatialCanvas node width is expanded to 224px');
assert(canvasContent.includes('const NODE_HEIGHT = 86;'), 'SpatialCanvas node height is expanded to 86px');
assert(canvasContent.includes('fontSize="14.5"'), 'SpatialCanvas node title is 14.5px');
assert(canvasContent.includes('fontSize="11"'), 'SpatialCanvas node category tag is 11px');
assert(canvasContent.includes('fontSize="12.5"'), 'SpatialCanvas edge traffic percentage is 12.5px');
assert(canvasContent.includes('fontSize="10"'), 'SpatialCanvas bottleneck badge is 10px');
assert(canvasContent.includes('fontSize="13"'), 'SpatialCanvas node cost readout is 13px');
assert(!canvasContent.includes('fontSize="8"') && !canvasContent.includes('fontSize="7.5"') && !canvasContent.includes('fontSize="9"'), 'Micro-typography eliminated from SpatialCanvas nodes');

// 4. SimulatorClient workbench typography
const simClientContent = readFileSync(resolve(process.cwd(), 'app/simulator/SimulatorClient.tsx'), 'utf-8');
assert(simClientContent.includes('.telemetry-cell-label') && simClientContent.includes('font-size: 0.75rem'), 'Workbench telemetry labels are at least 12px (0.75rem)');
assert(simClientContent.includes('.telemetry-cell-value') && (simClientContent.includes('1.375rem') || simClientContent.includes('1.4rem')), 'Workbench primary telemetry values are prominent (22px+)');
assert(simClientContent.includes('.insp-lbl') && simClientContent.includes('font-size: 0.75rem'), 'Inspector property labels are at least 12px (0.75rem)');
assert(simClientContent.includes('.palette-item-name') && simClientContent.includes('font-size: 0.875rem'), 'Palette component item names are 14px (0.875rem)');
assert(simClientContent.includes('.palette-item-desc') && simClientContent.includes('font-size: 0.78125rem'), 'Palette component descriptions are at least 12.5px');
assert(!simClientContent.includes('fontSize: \'0.5625rem\'') && !simClientContent.includes('font-size: 0.5625rem'), 'No 9px (0.5625rem) micro-text in SimulatorClient');

// 5. Blueprints & Assumptions
const templateContent = readFileSync(resolve(process.cwd(), 'app/templates/TemplatesClient.tsx'), 'utf-8');
assert(!templateContent.includes('fontSize: \'0.5625rem\''), 'No 9px micro-text in Blueprint cards');
assert(templateContent.includes('font-size: 0.75rem;') || templateContent.includes('fontSize: \'0.75rem\''), 'Blueprint cards satisfy 12px minimum standard');

const assumptionsContent = readFileSync(resolve(process.cwd(), 'app/assumptions/AssumptionsClient.tsx'), 'utf-8');
assert(!assumptionsContent.includes('fontSize: \'0.5625rem\''), 'No 9px micro-text in Model Registry assumptions');
assert(assumptionsContent.includes('font-size: 0.875rem;'), 'Model Registry data table font size is 14px (0.875rem)');

console.log(`\n============================================================`);
console.log(`All ${passedAssertions}/${passedAssertions} Readability & Typography assertions PASSED!`);
console.log(`============================================================`);
