/**
 * Defines which specification keys appear as filters, in what order,
 * and with what display label.
 */
export interface SpecConfig {
  key: string;    // exact key used in product.specification
  label: string;  // human-readable label shown in the filter panel
}

/**
 * SPEC FILTER CONFIG
 * ==================
 * Maps category slugs to the spec filters that should appear for that category.
 *
 * Rules:
 *  - Keys must match exactly what's stored in product.specification
 *  - Order of entries = order rendered in the filter sidebar
 *  - Any spec key NOT listed here is silently excluded from the UI
 *  - Categories not listed here fall back to FALLBACK_SPEC_CONFIG
 *
 * To add a new category:
 *  1. Find its slug (e.g. "gaming-laptops", "usb-hubs")
 *  2. Add an entry below with only the specs relevant to that category
 */

// ─── Shared building blocks ──────────────────────────────────────────────────
// Reuse these across similar categories instead of duplicating entries.

const BRAND:         SpecConfig = { key: 'brand',          label: 'Brand' };
const MATERIAL:      SpecConfig = { key: 'material',       label: 'Material' };
const WEIGHT:        SpecConfig = { key: 'weight',         label: 'Weight' };
const CONNECTIVITY:  SpecConfig = { key: 'connectivity',   label: 'Connectivity' };
const INTERFACE:     SpecConfig = { key: 'interface',      label: 'Interface' };
const COMPATIBILITY: SpecConfig = { key: 'compatibility',  label: 'Compatibility' };
const SCREEN_SIZE:   SpecConfig = { key: 'screen_size',    label: 'Screen Size' };
const RESOLUTION:    SpecConfig = { key: 'resolution',     label: 'Resolution' };
const REFRESH_RATE:  SpecConfig = { key: 'refresh_rate',   label: 'Refresh Rate' };
const RAM:           SpecConfig = { key: 'ram',            label: 'RAM' };
const STORAGE:       SpecConfig = { key: 'storage',        label: 'Storage' };
const PROCESSOR:     SpecConfig = { key: 'processor',      label: 'Processor' };
const GPU:           SpecConfig = { key: 'gpu',            label: 'GPU' };
const OS:            SpecConfig = { key: 'os',             label: 'Operating System' };
const BATTERY:       SpecConfig = { key: 'battery',        label: 'Battery Life' };
const FORM_FACTOR:   SpecConfig = { key: 'form_factor',    label: 'Form Factor' };
const SOCKET_TYPE:   SpecConfig = { key: 'socket_type',    label: 'Socket Type' };
const WATTAGE:       SpecConfig = { key: 'wattage',        label: 'Wattage' };
const SPEED:         SpecConfig = { key: 'speed',          label: 'Speed' };
const CAPACITY:      SpecConfig = { key: 'capacity',       label: 'Capacity' };
const SWITCH_TYPE:   SpecConfig = { key: 'switch_type',    label: 'Switch Type' };
const LAYOUT:        SpecConfig = { key: 'layout',         label: 'Layout' };
const DPI:           SpecConfig = { key: 'dpi',            label: 'DPI' };
const SENSOR:        SpecConfig = { key: 'sensor',         label: 'Sensor' };
const NOISE_CANCEL:  SpecConfig = { key: 'noise_cancellation', label: 'Noise Cancellation' };
const DRIVER_SIZE:   SpecConfig = { key: 'driver_size',    label: 'Driver Size' };
const FREQUENCY:     SpecConfig = { key: 'frequency',      label: 'Frequency Response' };
const PORTS:         SpecConfig = { key: 'ports',          label: 'Ports' };
const PANEL_TYPE:    SpecConfig = { key: 'panel_type',     label: 'Panel Type' };
const PRINT_TECH:    SpecConfig = { key: 'print_technology', label: 'Print Technology' };
const PRINT_SPEED:   SpecConfig = { key: 'print_speed',    label: 'Print Speed' };
const INK_TYPE:      SpecConfig = { key: 'ink_type',       label: 'Ink Type' };
const CAMERA_MP:     SpecConfig = { key: 'megapixels',     label: 'Megapixels' };
const ZOOM:          SpecConfig = { key: 'zoom',           label: 'Zoom' };
const DIMENSIONS:    SpecConfig = { key: 'dimensions',     label: 'Dimensions' };

// ─── Fallback (used when category has no specific config) ─────────────────────
export const FALLBACK_SPEC_CONFIG: SpecConfig[] = [
  BRAND, CONNECTIVITY, INTERFACE, MATERIAL, WEIGHT,
];

// ─── Default (used on the search page across all categories) ──────────────────
export const DEFAULT_SPEC_CONFIG: SpecConfig[] = [
  BRAND, STORAGE, RAM, PROCESSOR, SCREEN_SIZE,
  CONNECTIVITY, INTERFACE, MATERIAL, WEIGHT,
];

// ─── Category spec configs ────────────────────────────────────────────────────

const SPEC_CONFIG_MAP: Record<string, SpecConfig[]> = {

  // Laptops & Computers
  'laptops': [BRAND, PROCESSOR, RAM, STORAGE, SCREEN_SIZE, GPU, OS, BATTERY],
  'gaming-laptops': [BRAND, PROCESSOR, GPU, RAM, STORAGE, SCREEN_SIZE, REFRESH_RATE],
  'desktops': [BRAND, PROCESSOR, RAM, STORAGE, GPU, OS, FORM_FACTOR],
  'all-in-one-computers': [BRAND, PROCESSOR, RAM, STORAGE, SCREEN_SIZE, OS],
  'chromebooks': [BRAND, PROCESSOR, RAM, STORAGE, SCREEN_SIZE, BATTERY],

  // Monitors & Displays
  'monitors': [BRAND, SCREEN_SIZE, PANEL_TYPE, RESOLUTION, REFRESH_RATE, CONNECTIVITY],
  'gaming-monitors': [BRAND, SCREEN_SIZE, PANEL_TYPE, REFRESH_RATE, RESOLUTION, CONNECTIVITY],
  'portable-monitors': [BRAND, SCREEN_SIZE, RESOLUTION, CONNECTIVITY, WEIGHT],

  // Storage
  'hard-drives': [BRAND, CAPACITY, SPEED, INTERFACE, FORM_FACTOR],
  'ssds': [BRAND, CAPACITY, SPEED, INTERFACE, FORM_FACTOR],
  'usb-flash-drives': [BRAND, CAPACITY, INTERFACE],
  'memory-cards': [BRAND, CAPACITY, SPEED],
  'nas-storage': [BRAND, CAPACITY, CONNECTIVITY, FORM_FACTOR],

  // Memory
  'ram-memory': [BRAND, CAPACITY, SPEED, FORM_FACTOR, COMPATIBILITY],

  // Networking
  'routers': [BRAND, SPEED, CONNECTIVITY, FREQUENCY],
  'wifi-adapters': [BRAND, SPEED, CONNECTIVITY, INTERFACE],
  'network-switches': [BRAND, PORTS, SPEED],
  'network-cables': [BRAND, SPEED, { key: 'length', label: 'Length' }],

  // Input Devices
  'keyboards': [BRAND, SWITCH_TYPE, LAYOUT, CONNECTIVITY, COMPATIBILITY],
  'gaming-keyboards': [BRAND, SWITCH_TYPE, LAYOUT, CONNECTIVITY, { key: 'rgb', label: 'RGB Lighting' }],
  'mice': [BRAND, DPI, SENSOR, CONNECTIVITY, COMPATIBILITY],
  'gaming-mice': [BRAND, DPI, SENSOR, CONNECTIVITY, { key: 'rgb', label: 'RGB Lighting' }],
  'webcams': [BRAND, RESOLUTION, { key: 'fps', label: 'Frame Rate' }, CONNECTIVITY],
  'graphics-tablets': [BRAND, { key: 'active_area', label: 'Active Area' }, CONNECTIVITY],

  // Audio
  'headphones': [BRAND, CONNECTIVITY, NOISE_CANCEL, DRIVER_SIZE, FREQUENCY],
  'gaming-headsets': [BRAND, CONNECTIVITY, { key: 'surround_sound', label: 'Surround Sound' }, COMPATIBILITY],
  'earbuds': [BRAND, CONNECTIVITY, NOISE_CANCEL, { key: 'battery_life', label: 'Battery Life' }],
  'speakers': [BRAND, CONNECTIVITY, WATTAGE],
  'microphones': [BRAND, { key: 'polar_pattern', label: 'Polar Pattern' }, CONNECTIVITY, INTERFACE],

  // Peripherals & Accessories
  'usb-hubs': [BRAND, PORTS, INTERFACE],
  'docking-stations': [BRAND, PORTS, CONNECTIVITY, COMPATIBILITY],
  'laptop-bags': [BRAND, { key: 'size_compatibility', label: 'Size Compatibility' }, MATERIAL],
  'laptop-stands': [BRAND, MATERIAL, COMPATIBILITY],
  'cable-management': [BRAND, MATERIAL],
  'mouse-pads': [BRAND, { key: 'size', label: 'Size' }, MATERIAL],

  // Power
  'power-banks': [BRAND, CAPACITY, { key: 'output_ports', label: 'Output Ports' }, { key: 'fast_charge', label: 'Fast Charge' }],
  'ups': [BRAND, WATTAGE, { key: 'backup_time', label: 'Backup Time' }, { key: 'outlets', label: 'Outlets' }],
  'power-strips': [BRAND, { key: 'outlets', label: 'Outlets' }, { key: 'surge_protection', label: 'Surge Protection' }],
  'chargers': [BRAND, WATTAGE, CONNECTIVITY, COMPATIBILITY],

  // Printers & Scanners
  'printers': [BRAND, PRINT_TECH, INK_TYPE, PRINT_SPEED, CONNECTIVITY],
  'scanners': [BRAND, RESOLUTION, CONNECTIVITY, { key: 'scan_speed', label: 'Scan Speed' }],
  'ink-toner': [BRAND, { key: 'page_yield', label: 'Page Yield' }, COMPATIBILITY],

  // Phones & Tablets
  'smartphones': [BRAND, PROCESSOR, RAM, STORAGE, SCREEN_SIZE, CAMERA_MP, OS, BATTERY],
  'tablets': [BRAND, PROCESSOR, RAM, STORAGE, SCREEN_SIZE, OS, CONNECTIVITY],
  'phone-cases': [BRAND, MATERIAL, COMPATIBILITY],
  'screen-protectors': [BRAND, MATERIAL, COMPATIBILITY],

  // Cameras
  'cameras': [BRAND, CAMERA_MP, ZOOM, { key: 'sensor_size', label: 'Sensor Size' }],
  'camera-lenses': [BRAND, { key: 'focal_length', label: 'Focal Length' }, COMPATIBILITY],
  'camera-accessories': [BRAND, COMPATIBILITY],

  // Smart Home & IoT
  'smart-speakers': [BRAND, CONNECTIVITY],
  'smart-displays': [BRAND, SCREEN_SIZE, CONNECTIVITY],
  'security-cameras': [BRAND, RESOLUTION, CONNECTIVITY, { key: 'night_vision', label: 'Night Vision' }],

  // Gaming
  'gaming-consoles': [BRAND, { key: 'storage', label: 'Storage' }],
  'gaming-controllers': [BRAND, CONNECTIVITY, COMPATIBILITY],
  'gaming-chairs': [BRAND, MATERIAL, { key: 'max_weight', label: 'Max Weight' }],
  'gaming-desks': [BRAND, MATERIAL, DIMENSIONS],

  // Components
  'processors-cpus': [BRAND, { key: 'cores', label: 'Cores' }, SPEED, SOCKET_TYPE, COMPATIBILITY],
  'graphics-cards': [BRAND, GPU, { key: 'vram', label: 'VRAM' }, CONNECTIVITY],
  'motherboards': [BRAND, FORM_FACTOR, SOCKET_TYPE, { key: 'chipset', label: 'Chipset' }, COMPATIBILITY],
  'power-supplies': [BRAND, WATTAGE, { key: 'efficiency', label: 'Efficiency Rating' }, FORM_FACTOR],
  'pc-cases': [BRAND, FORM_FACTOR, MATERIAL],
  'cpu-coolers': [BRAND, { key: 'cooling_type', label: 'Cooling Type' }, COMPATIBILITY],
};

// ─── Public API ───────────────────────────────────────────────────────────────

/**
 * Returns the spec config for a given category slug.
 * Falls back to FALLBACK_SPEC_CONFIG if the category has no specific config.
 *
 * Usage:
 *   const specConfig = getSpecConfig(categorySlug);
 *   <SearchFilters specConfig={specConfig} ... />
 */
export function getSpecConfig(categorySlug: string | null | undefined): SpecConfig[] {
  if (!categorySlug) return FALLBACK_SPEC_CONFIG;
  return SPEC_CONFIG_MAP[categorySlug.toLowerCase()] ?? FALLBACK_SPEC_CONFIG;
}

/**
 * Returns true if a specific category has a dedicated spec config.
 * Useful for debugging or conditionally showing filter UI.
 */
export function hasSpecConfig(categorySlug: string): boolean {
  return categorySlug.toLowerCase() in SPEC_CONFIG_MAP;
}