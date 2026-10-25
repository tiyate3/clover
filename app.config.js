const widgetDefinitions = [
  {
    name: 'TodayCloverWidget',
    displayName: 'Today Clover',
    description: 'See today’s clovers and find a small win.',
    ios: { supportedFamilies: ['systemSmall'] },
  },
  {
    name: 'CloverStreakWidget',
    displayName: 'Clover Streak',
    description: 'Your streak and the last seven days, at a glance.',
    ios: { supportedFamilies: ['systemSmall'] },
  },
  {
    name: 'CloverWeekStripWidget',
    displayName: 'Clover Week',
    description: 'See your last seven days and today’s logging status.',
    ios: { supportedFamilies: ['systemMedium'] },
  },
  {
    name: 'CloverMiniCalendarWidget',
    displayName: 'Clover Calendar',
    description: 'See this month fill with your lucky moments.',
    ios: { supportedFamilies: ['systemLarge'] },
  },
  {
    name: 'CloverLockScreenWidget',
    displayName: 'Clover Lock Screen',
    description: 'See your streak on the Lock Screen.',
    ios: { supportedFamilies: ['accessoryCircular', 'accessoryRectangular'] },
  },
];

// The expo-widgets plugin builds the iOS widget extension, shares data through the app group
// `group.<bundle identifier>`, and registers the extension with EAS so its credentials are managed.
module.exports = ({ config }) => {
  const plugins = (config.plugins ?? []).filter((plugin) =>
    (Array.isArray(plugin) ? plugin[0] : plugin) !== 'expo-widgets',
  );
  plugins.push(['expo-widgets', { widgets: widgetDefinitions }]);
  return { ...config, plugins };
};
