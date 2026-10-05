export type Language = 'en' | 'bn';

export interface Translations {
  // App Header
  appName: string;
  appSubtitle: string;
  offlineReady: string;
  educationalDisclaimer: string;
  systemActive: string;

  // File Import & Dataset
  importDataset: string;
  dropJsonHere: string;
  browseFiles: string;
  loadDemo: string;
  currentBuilding: string;
  noDatasetLoaded: string;
  importSuccess: string;
  replaceDataset: string;
  datasetStats: string;
  nodesCount: string;
  edgesCount: string;
  roomsCount: string;
  junctionsCount: string;
  exitsCount: string;

  // Operations & Controls
  startLocation: string;
  chooseStartLocation: string;
  selectStartPrompt: string;
  resetToInitial: string;
  resetTooltip: string;
  resetSuccess: string;
  hazardManagement: string;
  roomJunctions: string;
  corridors: string;
  exits: string;
  blockNode: string;
  unblockNode: string;
  blockCorridor: string;
  unblockCorridor: string;
  closeExit: string;
  reopenExit: string;
  activeHazards: string;
  searchFilter: string;

  // Route & Status
  routeCalculation: string;
  routeStatus: string;
  statusRouteFound: string;
  statusStartBlocked: string;
  statusNoRoute: string;
  startingLocationBlocked: string;
  noRouteAvailable: string;
  bestRouteFound: string;
  destinationExit: string;
  totalCost: string;
  checkpoints: string;
  routeSequence: string;
  corridorCost: string;
  simulateWalkthrough: string;
  stopWalkthrough: string;
  currentStep: string;

  // Graph Visualization & Toolbar
  zoomIn: string;
  zoomOut: string;
  resetView: string;
  toggleCosts: string;
  legend: string;
  legendRoom: string;
  legendJunction: string;
  legendExit: string;
  legendActiveRoute: string;
  legendBlocked: string;
  legendClosed: string;

  // Instructions & Help
  quickGuide: string;
  instruction1: string;
  instruction2: string;
  instruction3: string;
  exportMap: string;

  // Validation & Errors
  validationErrorTitle: string;
  validationSuccessTitle: string;
  fixErrorsPrompt: string;
  unsupportedFileType: string;
}

export const translations: Record<Language, Translations> = {
  en: {
    appName: 'SMART ESCAPE',
    appSubtitle: 'Interactive Evacuation Route Simulator',
    offlineReady: 'Offline Verified',
    educationalDisclaimer: 'Educational simulation only. Not certified for actual emergency life safety.',
    systemActive: 'Simulation Ready',

    importDataset: 'Import Dataset',
    dropJsonHere: 'Drag & drop building JSON file here',
    browseFiles: 'Browse Local JSON',
    loadDemo: 'Load Sample Scenario',
    currentBuilding: 'Active Building Graph',
    noDatasetLoaded: 'No Building Dataset Loaded',
    importSuccess: 'Dataset loaded and validated successfully.',
    replaceDataset: 'Replace Dataset',
    datasetStats: 'Structural Metrics',
    nodesCount: 'Total Nodes',
    edgesCount: 'Corridors',
    roomsCount: 'Rooms',
    junctionsCount: 'Junctions',
    exitsCount: 'Emergency Exits',

    startLocation: 'Evacuation Starting Point',
    chooseStartLocation: 'Select Starting Location',
    selectStartPrompt: 'Select an unblocked room or junction to compute the safest exit route.',
    resetToInitial: 'Reset to Initial State',
    resetTooltip: 'Restores original hazard state from imported file exactly',
    resetSuccess: 'Restored original hazard state.',
    hazardManagement: 'Hazard Simulation Controls',
    roomJunctions: 'Rooms & Junctions',
    corridors: 'Corridors',
    exits: 'Emergency Exits',
    blockNode: 'Block Location',
    unblockNode: 'Clear Hazard',
    blockCorridor: 'Block Corridor',
    unblockCorridor: 'Clear Corridor',
    closeExit: 'Close Exit',
    reopenExit: 'Reopen Exit',
    activeHazards: 'Active Hazard Count',
    searchFilter: 'Filter locations...',

    routeCalculation: 'Evacuation Route Analysis',
    routeStatus: 'Status',
    statusRouteFound: 'Safe Route Found',
    statusStartBlocked: 'Starting Location Blocked',
    statusNoRoute: 'No Route Available',
    startingLocationBlocked: 'Starting location blocked',
    noRouteAvailable: 'No route available',
    bestRouteFound: 'Safest evacuation path calculated to nearest accessible exit.',
    destinationExit: 'Target Exit',
    totalCost: 'Total Route Cost',
    checkpoints: 'Transit Nodes',
    routeSequence: 'Optimal Waypoint Sequence',
    corridorCost: 'Corridor Cost',
    simulateWalkthrough: 'Simulate Evacuation',
    stopWalkthrough: 'Pause Walkthrough',
    currentStep: 'Evacuee position',

    zoomIn: 'Zoom In',
    zoomOut: 'Zoom Out',
    resetView: 'Fit Graph',
    toggleCosts: 'Toggle Costs',
    legend: 'Map Legend',
    legendRoom: 'Room (Startable)',
    legendJunction: 'Junction',
    legendExit: 'Open Exit',
    legendActiveRoute: 'Active Route',
    legendBlocked: 'Hazard / Blocked',
    legendClosed: 'Closed Exit',

    quickGuide: 'Operation Protocol',
    instruction1: '1. Select an unblocked room or junction on the floor plan or dropdown.',
    instruction2: '2. Click nodes or corridors to simulate real-time fires or blockages.',
    instruction3: '3. Dijkstra engine immediately reroutes to lowest-cost open exit.',
    exportMap: 'Export Map SVG',

    validationErrorTitle: 'Dataset Validation Failed',
    validationSuccessTitle: 'Building Graph Validated',
    fixErrorsPrompt: 'Please resolve the following structural validation issues in the JSON file:',
    unsupportedFileType: 'Only valid .json files are supported.',
  },

  bn: {
    appName: 'স্মার্ট এস্কেপ',
    appSubtitle: 'ইন্টারেক্টিভ উদ্ধার রুট সিমুলেটর',
    offlineReady: 'অফলাইন প্রস্তুত',
    educationalDisclaimer: 'শুধুমাত্র শিক্ষামূলক সিমুলেশন। আসল জরুরি জীবন সুরক্ষার জন্য প্রত্যয়িত নয়।',
    systemActive: 'সিমুলেশন সক্রিয়',

    importDataset: 'ডেটাবেইজ ইমপোর্ট',
    dropJsonHere: 'ভবনের JSON ফাইলটি এখানে ড্রপ করুন',
    browseFiles: 'ফাইল নির্বাচন করুন',
    loadDemo: 'নমুনা দৃশ্যপট লোড করুন',
    currentBuilding: 'বর্তমান ভবনের গ্রাফ',
    noDatasetLoaded: 'কোনো ভবনের ডেটাসেট লোড করা নেই',
    importSuccess: 'ডেটাসেট সফলভাবে লোড এবং যাচাই করা হয়েছে।',
    replaceDataset: 'নতুন ডেটা ইমপোর্ট করুন',
    datasetStats: 'কাঠামোগত পরিমাপ',
    nodesCount: 'মোট নোড',
    edgesCount: 'করিডোর',
    roomsCount: 'রুম',
    junctionsCount: 'জাংশন',
    exitsCount: 'জরুরি বহির্গমন পথ',

    startLocation: 'উদ্ধার শুরুর স্থান',
    chooseStartLocation: 'শুরুর স্থান নির্বাচন করুন',
    selectStartPrompt: 'নিরাপদ রুট গণনার জন্য যেকোনো উন্মুক্ত রুম বা জাংশন নির্বাচন করুন।',
    resetToInitial: 'পূর্বাবস্থায় রিসেট করুন',
    resetTooltip: 'JSON ফাইলের মূল বিপদাবস্থা অবিকল পুনরুদ্ধার করে',
    resetSuccess: 'মূল বিপদের অবস্থায় ফিরে এসেছে।',
    hazardManagement: 'বিপদ সিমুলেশন নিয়ন্ত্রণ',
    roomJunctions: 'রুম ও জাংশনসমূহ',
    corridors: 'করিডোরসমূহ',
    exits: 'জরুরি বহির্গমনসমূহ',
    blockNode: 'স্থান অবরুদ্ধ করুন',
    unblockNode: 'বিপদ মুক্ত করুন',
    blockCorridor: 'করিডোর অবরুদ্ধ করুন',
    unblockCorridor: 'করিডোর খুলুন',
    closeExit: 'বহির্গমন বন্ধ করুন',
    reopenExit: 'বহির্গমন খুলুন',
    activeHazards: 'সক্রিয় বিপদের সংখ্যা',
    searchFilter: 'স্থান খুঁজুন...',

    routeCalculation: 'উদ্ধার রুট বিশ্লেষণ',
    routeStatus: 'অবস্থা',
    statusRouteFound: 'নিরাপদ পথ পাওয়া গেছে',
    statusStartBlocked: 'শুরুর স্থান অবরুদ্ধ',
    statusNoRoute: 'কোনো পথ উপলব্ধ নেই',
    startingLocationBlocked: 'Starting location blocked',
    noRouteAvailable: 'No route available',
    bestRouteFound: 'নিকটতম উন্মুক্ত বহির্গমনে সর্বনিম্ন ব্যয়ের পথ নির্ণয় করা হয়েছে।',
    destinationExit: 'গন্তব্য বহির্গমন',
    totalCost: 'মোট রুট ব্যয়',
    checkpoints: 'মধ্যবর্তী নোড',
    routeSequence: 'সর্বোত্তম পথ পরিক্রমা',
    corridorCost: 'করিডোর ব্যয়',
    simulateWalkthrough: 'উদ্ধার পরিক্রমা চালান',
    stopWalkthrough: 'পরিক্রমা থামান',
    currentStep: 'উদ্ধারকারীর অবস্থান',

    zoomIn: 'জুম ইন',
    zoomOut: 'জুম আউট',
    resetView: 'ম্যাপ রিসেট',
    toggleCosts: 'ব্যয় প্রদর্শন',
    legend: 'ম্যাপ নির্দেশিকা',
    legendRoom: 'রুম',
    legendJunction: 'জাংশন',
    legendExit: 'উন্মুক্ত বহির্গমন',
    legendActiveRoute: 'সক্রিয় পথ',
    legendBlocked: 'অবরুদ্ধ / বিপদ',
    legendClosed: 'বন্ধ বহির্গমন',

    quickGuide: 'ব্যবহারের নিয়মাবলী',
    instruction1: '১. ম্যাপ বা তালিকা থেকে একটি উন্মুক্ত রুম বা জাংশন বেছে নিন।',
    instruction2: '২. নোড বা করিডোরে ক্লিক করে তাৎক্ষণিক বিপদ বা আগুন তৈরি করুন।',
    instruction3: '৩. অ্যালগরিদম তাৎক্ষণিকভাবে সর্বনিম্ন খরচে নতুন পথ খুঁজে বের করবে।',
    exportMap: 'ম্যাপ SVG ডাউনলোড',

    validationErrorTitle: 'ডেটাসেট যাচাই ব্যর্থ হয়েছে',
    validationSuccessTitle: 'ভবনের গ্রাফ সঠিকভাবে যাচাইকৃত',
    fixErrorsPrompt: 'অনুগ্রহ করে JSON ফাইলের নিম্নলিখিত কাঠামোগত ত্রুটিগুলি সমাধান করুন:',
    unsupportedFileType: 'শুধুমাত্র বৈধ .json ফাইল সমর্থিত।',
  },
};
